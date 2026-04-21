import { spawn } from "child_process";
import { createWriteStream, promises as fs } from "fs";
import { join } from "path";
import { homedir, tmpdir } from "os";
import { get as httpsGet } from "https";
import { randomUUID } from "crypto";
import { resetToolchainCache } from "./detect-toolchain.js";

export interface InstallProgress {
  stage: "resolving" | "downloading" | "extracting" | "core_index" | "core_install" | "done" | "error";
  percent: number;
  message: string;
}

export const INSTALL_DIR = join(homedir(), ".embedflow", "bin");
export const ARDUINO_CLI_PATH = join(INSTALL_DIR, "arduino-cli.exe");

// Fetch the download URL for the latest Windows 64-bit release from GitHub
async function getLatestDownloadUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path: "/repos/arduino/arduino-cli/releases/latest",
      headers: { "User-Agent": "EmbedFlow/1.0" },
    };
    httpsGet(options, (res) => {
      // Follow redirect
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        httpsGet(res.headers.location, handleRelease).on("error", reject);
        return;
      }
      handleRelease(res);

      function handleRelease(response: typeof res) {
        let data = "";
        response.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        response.on("end", () => {
          try {
            const release = JSON.parse(data) as {
              assets?: Array<{ name: string; browser_download_url: string }>;
            };
            const asset = release.assets?.find(
              (a) => a.name.includes("Windows") && a.name.includes("64bit") && a.name.endsWith(".zip"),
            );
            if (asset) resolve(asset.browser_download_url);
            else reject(new Error("Asset Windows_64bit introuvable dans la release GitHub"));
          } catch (e) {
            reject(new Error(`Impossible de parser la réponse GitHub : ${(e as Error).message}`));
          }
        });
        response.on("error", reject);
      }
    }).on("error", reject);
  });
}

// Download a URL to a file, following redirects, calling onProgress(0-100)
async function downloadFile(url: string, dest: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);

    function request(targetUrl: string) {
      httpsGet(targetUrl, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          request(res.headers.location);
          return;
        }
        const total = parseInt(res.headers["content-length"] ?? "0", 10);
        let downloaded = 0;
        res.on("data", (chunk: Buffer) => {
          downloaded += chunk.length;
          if (total > 0) onProgress(Math.round((downloaded / total) * 100));
        });
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
        res.on("error", reject);
      }).on("error", reject);
    }

    request(url);
    file.on("error", reject);
  });
}

// Run a command, resolving with stdout+stderr, rejecting on non-zero exit
function runCmd(
  cmd: string,
  args: string[],
  extraEnv?: Record<string, string>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PATH: `${INSTALL_DIR};${process.env.PATH ?? ""}`, ...extraEnv };
    const proc = spawn(cmd, args, { env });
    let out = "";
    proc.stdout?.on("data", (d: Buffer) => { out += d.toString(); });
    proc.stderr?.on("data", (d: Buffer) => { out += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(out.trim() || `Exit code ${code}`));
    });
    proc.on("error", reject);
  });
}

export async function installToolchain(
  onProgress: (p: InstallProgress) => void,
): Promise<boolean> {
  try {
    await fs.mkdir(INSTALL_DIR, { recursive: true });

    // 1. Resolve latest release URL
    onProgress({ stage: "resolving", percent: 2, message: "Recherche de la dernière version d'arduino-cli..." });
    const downloadUrl = await getLatestDownloadUrl();
    const version = downloadUrl.match(/download\/v([^/]+)\//)?.[1] ?? "?";

    // 2. Download zip
    onProgress({ stage: "downloading", percent: 5, message: `Téléchargement arduino-cli v${version}...` });
    const zipPath = join(tmpdir(), `arduino-cli-${randomUUID()}.zip`);
    await downloadFile(downloadUrl, zipPath, (pct) => {
      onProgress({ stage: "downloading", percent: 5 + Math.round(pct * 0.45), message: `Téléchargement... ${pct}%` });
    });

    // 3. Extract with PowerShell (no extra deps needed)
    onProgress({ stage: "extracting", percent: 52, message: "Extraction de l'archive..." });
    await runCmd("powershell.exe", [
      "-NoProfile", "-NonInteractive", "-Command",
      `Expand-Archive -Path '${zipPath}' -DestinationPath '${INSTALL_DIR}' -Force`,
    ]);
    fs.unlink(zipPath).catch(() => {});

    // Verify binary exists
    await fs.access(ARDUINO_CLI_PATH);
    onProgress({ stage: "extracting", percent: 60, message: "arduino-cli extrait." });

    // 4. Update board index
    onProgress({ stage: "core_index", percent: 65, message: "Mise à jour de l'index des cartes..." });
    await runCmd(ARDUINO_CLI_PATH, ["core", "update-index"]);

    // 5. Install arduino:avr core
    onProgress({ stage: "core_install", percent: 72, message: "Installation du core Arduino AVR (peut prendre 1-2 min)..." });
    await runCmd(ARDUINO_CLI_PATH, ["core", "install", "arduino:avr"]);

    // Done — reset toolchain cache so next compile finds the new binary
    resetToolchainCache();

    onProgress({ stage: "done", percent: 100, message: `arduino-cli v${version} installé avec succès !` });
    return true;
  } catch (err) {
    const e = err as Error;
    onProgress({ stage: "error", percent: 0, message: e.message });
    return false;
  }
}

import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { getBoard } from "@embedflow/hardware-db";
import { detectToolchain } from "./detect-toolchain.js";

export interface FlashRequest {
  target: string;
  portPath: string;
  code: string;
}

export interface FlashProgress {
  stage: "preparing" | "connecting" | "writing" | "verifying" | "done" | "error";
  percent: number;
  message: string;
}

export async function flashBoard(
  request: FlashRequest,
  onProgress: (progress: FlashProgress) => void,
): Promise<{ success: boolean; error?: string }> {
  const toolchain = await detectToolchain();
  if (!toolchain.available) {
    onProgress({ stage: "error", percent: 0, message: "arduino-cli n'est pas installe" });
    return { success: false, error: "arduino-cli non disponible" };
  }

  const board = getBoard(request.target);
  if (!board?.fqbn) {
    onProgress({ stage: "error", percent: 0, message: `Carte inconnue : ${request.target}` });
    return { success: false, error: "Carte inconnue" };
  }

  onProgress({ stage: "preparing", percent: 5, message: "Préparation du sketch..." });

  // Write .ino source to a temp sketch directory
  const tmpDir = join(tmpdir(), `embedflow-flash-${randomUUID()}`);
  const sketchDir = join(tmpDir, "sketch");

  try {
    await fs.mkdir(sketchDir, { recursive: true });
    await fs.writeFile(join(sketchDir, "sketch.ino"), request.code, "utf-8");

    onProgress({ stage: "connecting", percent: 15, message: "Compilation et envoi vers la carte..." });

    return await new Promise((resolve) => {
      // compile --upload does both steps in one pass — no need for a separate binary
      const proc = spawn(toolchain.path, [
        "compile",
        "--upload",
        "--fqbn", board.fqbn!,
        "--port", request.portPath,
        "--verbose",
        sketchDir,
      ]);

      let output = "";
      let progress = 15;

      const handleData = (data: Buffer) => {
        const text = data.toString();
        output += text;

        if (text.includes("Compiling")) {
          onProgress({ stage: "preparing", percent: Math.min(progress += 5, 40), message: "Compilation..." });
        } else if (text.includes("Connecting") || text.includes("connecting")) {
          onProgress({ stage: "connecting", percent: 45, message: "Connexion à la carte..." });
        } else if (text.includes("Writing") || text.includes("writing")) {
          progress = Math.min(progress + 8, 75);
          onProgress({ stage: "writing", percent: progress, message: "Écriture du programme..." });
        } else if (text.includes("####")) {
          const hashes = (text.match(/#/g) || []).length;
          progress = Math.min(75 + hashes, 90);
          onProgress({ stage: "writing", percent: progress, message: "Écriture du programme..." });
        } else if (text.includes("Verif") || text.includes("verif")) {
          onProgress({ stage: "verifying", percent: 92, message: "Vérification..." });
        }
      };

      proc.stdout.on("data", handleData);
      proc.stderr.on("data", handleData);

      proc.on("close", (code) => {
        fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        if (code === 0) {
          onProgress({ stage: "done", percent: 100, message: "Envoyé avec succès !" });
          resolve({ success: true });
        } else {
          const errorMsg = output.slice(-800);
          onProgress({ stage: "error", percent: 0, message: errorMsg || "Erreur d'envoi" });
          resolve({ success: false, error: errorMsg });
        }
      });

      proc.on("error", (err) => {
        fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        onProgress({ stage: "error", percent: 0, message: err.message });
        resolve({ success: false, error: err.message });
      });
    });
  } catch (err) {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    const e = err as Error;
    onProgress({ stage: "error", percent: 0, message: e.message });
    return { success: false, error: e.message };
  }
}

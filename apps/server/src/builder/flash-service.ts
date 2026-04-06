import { spawn } from "child_process";
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

  onProgress({ stage: "preparing", percent: 5, message: "Preparation du telechargement..." });

  return new Promise((resolve) => {
    const proc = spawn("arduino-cli", [
      "upload",
      "--fqbn", board.fqbn!,
      "--port", request.portPath,
      "--input-file", "-",
      "--verbose",
    ]);

    let stderr = "";
    let progress = 10;

    proc.stderr.on("data", (data: Buffer) => {
      const text = data.toString();
      stderr += text;

      // Parse avrdude-style progress markers
      if (text.includes("Connecting")) {
        onProgress({ stage: "connecting", percent: 20, message: "Connexion a la carte..." });
      } else if (text.includes("Writing") || text.includes("writing")) {
        progress = Math.min(progress + 10, 70);
        onProgress({ stage: "writing", percent: progress, message: "Ecriture du programme..." });
      } else if (text.includes("####")) {
        // avrdude progress bars
        const hashes = (text.match(/#/g) || []).length;
        progress = Math.min(70 + hashes, 90);
        onProgress({ stage: "writing", percent: progress, message: "Ecriture du programme..." });
      } else if (text.includes("Verif") || text.includes("verif")) {
        onProgress({ stage: "verifying", percent: 92, message: "Verification..." });
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        onProgress({ stage: "done", percent: 100, message: "Telechargement reussi !" });
        resolve({ success: true });
      } else {
        const errorMsg = stderr.slice(-500);
        onProgress({ stage: "error", percent: 0, message: errorMsg || "Erreur de telechargement" });
        resolve({ success: false, error: errorMsg });
      }
    });

    proc.on("error", (err) => {
      onProgress({ stage: "error", percent: 0, message: err.message });
      resolve({ success: false, error: err.message });
    });
  });
}

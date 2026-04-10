import { execFile } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { getBoard } from "@embedflow/hardware-db";
import { detectToolchain } from "./detect-toolchain.js";

const execFileAsync = promisify(execFile);

export interface CompileRequest {
  code: string;
  target: string;
}

export interface CompileError {
  line: number;
  column: number;
  level: "error" | "warning";
  message: string;
  raw: string;
  blockLabel?: string;
}

export interface CompileResult {
  success: boolean;
  errors: CompileError[];
  warnings: CompileError[];
  binaryPath?: string;
  binarySize?: number;
  rawOutput: string;
  duration: number;
}

// Mutex to prevent concurrent compilations
let compiling = false;

function extractBlockLabel(code: string, lineNumber: number): string | undefined {
  const lines = code.split("\n");
  // Search backwards from error line for the nearest // label comment
  for (let i = lineNumber - 2; i >= 0; i--) {
    const match = lines[i]?.match(/^\/\/\s+(.+)$/);
    if (match) {
      const label = match[1].trim();
      // Skip section headers like "--- Includes ---"
      if (!label.startsWith("---") && !label.startsWith("#") && !label.startsWith("EmbedFlow")) {
        return label;
      }
    }
  }
  return undefined;
}

function parseErrors(stderr: string, code: string): { errors: CompileError[]; warnings: CompileError[] } {
  const errors: CompileError[] = [];
  const warnings: CompileError[] = [];

  // Match gcc error/warning lines: file:line:col: error/warning: message
  const regex = /sketch\.ino:(\d+):(\d+)?:\s*(error|warning):\s*(.+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(stderr)) !== null) {
    const line = parseInt(match[1], 10);
    const col = parseInt(match[2] ?? "0", 10);
    const level = match[3] as "error" | "warning";
    const message = match[4].trim();

    const entry: CompileError = {
      line,
      column: col,
      level,
      message,
      raw: match[0],
      blockLabel: extractBlockLabel(code, line),
    };

    if (level === "error") {
      errors.push(entry);
    } else {
      warnings.push(entry);
    }
  }

  return { errors, warnings };
}

export async function compileCode(request: CompileRequest): Promise<CompileResult> {
  if (compiling) {
    return {
      success: false,
      errors: [{ line: 0, column: 0, level: "error", message: "Compilation deja en cours", raw: "" }],
      warnings: [],
      rawOutput: "",
      duration: 0,
    };
  }

  const toolchain = await detectToolchain();
  if (!toolchain.available) {
    return {
      success: false,
      errors: [{
        line: 0,
        column: 0,
        level: "error",
        message: "arduino-cli n'est pas installe. Installez-le avec : choco install arduino-cli  puis : arduino-cli core install arduino:avr",
        raw: "",
      }],
      warnings: [],
      rawOutput: "arduino-cli introuvable dans le PATH.",
      duration: 0,
    };
  }

  const board = getBoard(request.target);
  if (!board?.fqbn) {
    return {
      success: false,
      errors: [{ line: 0, column: 0, level: "error", message: `Carte inconnue : ${request.target}`, raw: "" }],
      warnings: [],
      rawOutput: "",
      duration: 0,
    };
  }

  compiling = true;
  const start = Date.now();
  const tmpDir = join(tmpdir(), `embedflow-${randomUUID()}`);
  const sketchDir = join(tmpDir, "sketch");
  const outputDir = join(tmpDir, "output");

  try {
    await fs.mkdir(sketchDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(join(sketchDir, "sketch.ino"), request.code, "utf-8");

    let rawOutput = "";
    try {
      const { stdout, stderr } = await execFileAsync(
        toolchain.path,
        [
          "compile",
          "--fqbn", board.fqbn,
          "--output-dir", outputDir,
          sketchDir,
        ],
        { timeout: 60000 }
      );
      rawOutput = stdout + stderr;
    } catch (err) {
      const execErr = err as { stdout?: string; stderr?: string; message?: string };
      rawOutput = (execErr.stdout ?? "") + (execErr.stderr ?? "") + (execErr.message ?? "");
    }

    const { errors, warnings } = parseErrors(rawOutput, request.code);
    const success = errors.length === 0;

    // Find binary size if successful
    let binaryPath: string | undefined;
    let binarySize: number | undefined;
    if (success) {
      try {
        const files = await fs.readdir(outputDir);
        const hexFile = files.find((f) => f.endsWith(".hex") || f.endsWith(".bin"));
        if (hexFile) {
          binaryPath = join(outputDir, hexFile);
          const stat = await fs.stat(binaryPath);
          binarySize = stat.size;
        }
      } catch {
        // Binary not found — not critical
      }
    }

    return {
      success,
      errors,
      warnings,
      binaryPath,
      binarySize,
      rawOutput,
      duration: Date.now() - start,
    };
  } finally {
    compiling = false;
    // Clean up temp directory
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

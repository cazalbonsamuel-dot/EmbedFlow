import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface ToolchainInfo {
  tool: "arduino-cli" | null;
  path: string;
  version: string;
  available: boolean;
}

let cachedInfo: ToolchainInfo | null = null;

export async function detectToolchain(): Promise<ToolchainInfo> {
  if (cachedInfo) return cachedInfo;

  try {
    const { stdout } = await execFileAsync("arduino-cli", ["version", "--format", "json"], {
      timeout: 5000,
    });

    const parsed = JSON.parse(stdout) as { VersionString?: string; version?: string };
    const version = parsed.VersionString ?? parsed.version ?? "unknown";

    cachedInfo = {
      tool: "arduino-cli",
      path: "arduino-cli",
      version,
      available: true,
    };
  } catch {
    cachedInfo = {
      tool: null,
      path: "",
      version: "",
      available: false,
    };
  }

  return cachedInfo;
}

export function resetToolchainCache(): void {
  cachedInfo = null;
}

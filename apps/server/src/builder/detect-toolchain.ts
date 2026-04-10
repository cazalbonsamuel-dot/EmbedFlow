import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { homedir } from "os";

const execFileAsync = promisify(execFile);

export interface ToolchainInfo {
  tool: "arduino-cli" | null;
  path: string;
  version: string;
  available: boolean;
}

let cachedInfo: ToolchainInfo | null = null;

// Locations to probe, in order of preference
const CANDIDATE_PATHS = [
  "arduino-cli", // system PATH
  join(homedir(), ".embedflow", "bin", "arduino-cli.exe"), // auto-installed
  join(homedir(), ".embedflow", "bin", "arduino-cli"),
];

async function probe(path: string): Promise<ToolchainInfo | null> {
  try {
    const { stdout } = await execFileAsync(path, ["version", "--format", "json"], { timeout: 5000 });
    const parsed = JSON.parse(stdout) as { VersionString?: string; version?: string };
    const version = parsed.VersionString ?? parsed.version ?? "unknown";
    return { tool: "arduino-cli", path, version, available: true };
  } catch {
    return null;
  }
}

export async function detectToolchain(): Promise<ToolchainInfo> {
  if (cachedInfo) return cachedInfo;

  for (const candidate of CANDIDATE_PATHS) {
    const info = await probe(candidate);
    if (info) {
      cachedInfo = info;
      return cachedInfo;
    }
  }

  cachedInfo = { tool: null, path: "", version: "", available: false };
  return cachedInfo;
}

export function resetToolchainCache(): void {
  cachedInfo = null;
}

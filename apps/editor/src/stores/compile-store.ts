import { create } from "zustand";
import { generateCode, generateProjectCode, type TargetPlatform } from "@embedflow/codegen";
import { useWorkflowStore } from "./workflow-store";

export interface CompileError {
  line: number;
  column: number;
  level: "error" | "warning";
  message: string;
  raw: string;
  blockLabel?: string;
}

export interface InstallProgress {
  stage: "resolving" | "downloading" | "extracting" | "core_index" | "core_install" | "done" | "error";
  percent: number;
  message: string;
}

interface CompileState {
  status: "idle" | "compiling" | "success" | "error";
  errors: CompileError[];
  warnings: CompileError[];
  rawOutput: string;
  binarySize: number | null;
  duration: number | null;
  toolchainAvailable: boolean | null;
  generatedCode: string;
  toolchainMissing: boolean;

  installStatus: "idle" | "installing" | "success" | "error";
  installProgress: InstallProgress | null;

  compile: () => Promise<void>;
  checkToolchain: () => Promise<void>;
  clearErrors: () => void;
  install: () => Promise<void>;
}

const SERVER = "http://localhost:3001";

export const useCompileStore = create<CompileState>((set) => ({
  status: "idle",
  errors: [],
  warnings: [],
  rawOutput: "",
  binarySize: null,
  duration: null,
  toolchainAvailable: null,
  generatedCode: "",
  toolchainMissing: false,
  installStatus: "idle",
  installProgress: null,

  checkToolchain: async () => {
    try {
      const res = await fetch(`${SERVER}/api/toolchain`);
      const info = await res.json() as { available: boolean };
      set({ toolchainAvailable: info.available });
    } catch {
      set({ toolchainAvailable: false });
    }
  },

  compile: async () => {
    const workflowState = useWorkflowStore.getState();
    const { boardId } = workflowState;
    const allWorkflows = workflowState.getAllWorkflows();
    set({ status: "compiling", errors: [], warnings: [], rawOutput: "" });

    try {
      // Use project codegen if there are sub-workflows, otherwise single workflow
      const hasSubWorkflows = allWorkflows.some((w) => !w.isMain);
      const codeResult = hasSubWorkflows
        ? generateProjectCode(allWorkflows, {
            target: boardId as TargetPlatform,
            comments: true,
            language: "fr",
          })
        : generateCode(workflowState.workflow, {
            target: boardId as TargetPlatform,
            comments: true,
            language: "fr",
          });

      set({ generatedCode: codeResult.code });

      const res = await fetch(`${SERVER}/api/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeResult.code, target: boardId }),
      });

      const result = await res.json() as {
        success: boolean;
        errors: CompileError[];
        warnings: CompileError[];
        rawOutput: string;
        binarySize?: number;
        duration: number;
      };

      const toolchainMissing = !result.success &&
        result.errors.some((e) => e.message.includes("arduino-cli"));

      set({
        status: result.success ? "success" : "error",
        errors: result.errors,
        warnings: result.warnings,
        rawOutput: result.rawOutput,
        binarySize: result.binarySize ?? null,
        duration: result.duration,
        toolchainMissing,
      });
    } catch (err) {
      const e = err as Error;
      set({
        status: "error",
        errors: [{ line: 0, column: 0, level: "error", message: e.message, raw: "" }],
        warnings: [],
        rawOutput: e.message,
        binarySize: null,
        duration: null,
        toolchainMissing: false,
      });
    }
  },

  clearErrors: () => {
    set({ errors: [], warnings: [], status: "idle", toolchainMissing: false });
  },

  install: async () => {
    set({ installStatus: "installing", installProgress: null });

    try {
      const res = await fetch(`${SERVER}/api/toolchain/install`, { method: "POST" });
      if (!res.body) throw new Error("Pas de réponse SSE");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6)) as InstallProgress;
            set({ installProgress: data });
            if (data.stage === "done") {
              set({ installStatus: "success", toolchainMissing: false });
            } else if (data.stage === "error") {
              set({ installStatus: "error" });
            }
          }
        }
      }
    } catch (err) {
      const e = err as Error;
      set({
        installStatus: "error",
        installProgress: { stage: "error", percent: 0, message: e.message },
      });
    }
  },
}));

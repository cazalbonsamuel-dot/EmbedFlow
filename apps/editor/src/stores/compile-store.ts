import { create } from "zustand";
import { generateCode, type TargetPlatform } from "@embedflow/codegen";
import { useWorkflowStore } from "./workflow-store";

export interface CompileError {
  line: number;
  column: number;
  level: "error" | "warning";
  message: string;
  raw: string;
  blockLabel?: string;
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

  compile: () => Promise<void>;
  checkToolchain: () => Promise<void>;
  clearErrors: () => void;
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
    const { workflow, boardId } = useWorkflowStore.getState();
    set({ status: "compiling", errors: [], warnings: [], rawOutput: "" });

    try {
      const codeResult = generateCode(workflow, {
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

      set({
        status: result.success ? "success" : "error",
        errors: result.errors,
        warnings: result.warnings,
        rawOutput: result.rawOutput,
        binarySize: result.binarySize ?? null,
        duration: result.duration,
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
      });
    }
  },

  clearErrors: () => {
    set({ errors: [], warnings: [], status: "idle" });
  },
}));

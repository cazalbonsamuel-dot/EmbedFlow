import { create } from "zustand";
import { generateCode, type TargetPlatform } from "@embedflow/codegen";
import { useWorkflowStore } from "./workflow-store";

export interface ConnectedPort {
  port: string;
  boardName: string;
  fqbn: string;
}

export interface FlashProgress {
  stage: "preparing" | "connecting" | "writing" | "verifying" | "done" | "error";
  percent: number;
  message: string;
}

interface FlashState {
  status: "idle" | "detecting" | "ready" | "flashing" | "success" | "error";
  progress: FlashProgress | null;
  connectedPorts: ConnectedPort[];
  selectedPort: string | null;
  errorMessage: string | null;
  browserSupported: boolean;
  showDialog: boolean;

  openDialog: () => void;
  closeDialog: () => void;
  detectBoards: () => Promise<void>;
  selectPort: (port: string) => void;
  flash: () => Promise<void>;
  reset: () => void;
}

const SERVER = "http://localhost:3001";

export const useFlashStore = create<FlashState>((set, get) => ({
  status: "idle",
  progress: null,
  connectedPorts: [],
  selectedPort: null,
  errorMessage: null,
  browserSupported: typeof navigator !== "undefined" && "serial" in navigator,
  showDialog: false,

  openDialog: () => {
    set({ showDialog: true, status: "idle", errorMessage: null, progress: null });
    get().detectBoards();
  },

  closeDialog: () => {
    set({ showDialog: false });
  },

  detectBoards: async () => {
    set({ status: "detecting", connectedPorts: [] });
    try {
      const res = await fetch(`${SERVER}/api/boards/connected`);
      const ports = await res.json() as Array<{
        port?: { address?: string };
        matching_boards?: Array<{ name?: string; fqbn?: string }>;
      }>;

      const mapped: ConnectedPort[] = ports
        .filter((p) => p.port?.address)
        .map((p) => ({
          port: p.port?.address ?? "",
          boardName: p.matching_boards?.[0]?.name ?? "Carte inconnue",
          fqbn: p.matching_boards?.[0]?.fqbn ?? "",
        }));

      set({
        status: "ready",
        connectedPorts: mapped,
        selectedPort: mapped[0]?.port ?? null,
      });
    } catch {
      set({ status: "ready", connectedPorts: [] });
    }
  },

  selectPort: (port) => {
    set({ selectedPort: port });
  },

  flash: async () => {
    const { selectedPort } = get();
    if (!selectedPort) return;

    const { workflow, boardId } = useWorkflowStore.getState();
    const codeResult = generateCode(workflow, {
      target: boardId as TargetPlatform,
      comments: false,
      language: "fr",
    });

    set({ status: "flashing", progress: { stage: "preparing", percent: 0, message: "Preparation..." } });

    try {
      const res = await fetch(`${SERVER}/api/flash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: boardId, portPath: selectedPort, code: codeResult.code }),
      });

      if (!res.body) throw new Error("Pas de reponse SSE");

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
            const data = JSON.parse(line.slice(6)) as FlashProgress;
            set({ progress: data });
            if (data.stage === "done") {
              set({ status: "success" });
            } else if (data.stage === "error") {
              set({ status: "error", errorMessage: data.message });
            }
          }
        }
      }
    } catch (err) {
      const e = err as Error;
      set({ status: "error", errorMessage: e.message });
    }
  },

  reset: () => {
    set({ status: "idle", progress: null, errorMessage: null });
  },
}));

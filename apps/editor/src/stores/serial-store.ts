import { create } from "zustand";

export interface SerialLine {
  text: string;
  timestamp: number;
  type: "rx" | "tx";
}

type SerialStatus = "disconnected" | "connecting" | "connected" | "error";

interface SerialState {
  status: SerialStatus;
  lines: SerialLine[];
  portPath: string;
  baudRate: number;
  graphMode: boolean;
  graphData: { timestamp: number; value: number }[];
  ws: WebSocket | null;

  connect: (portPath: string, baudRate: number, fqbn: string) => void;
  disconnect: () => void;
  send: (data: string) => void;
  clear: () => void;
  toggleGraphMode: () => void;
  setPortPath: (port: string) => void;
  setBaudRate: (rate: number) => void;
}

const WS_URL = "ws://localhost:3001/ws/serial";
const MAX_LINES = 1000;

function connectWs(
  portPath: string,
  baudRate: number,
  fqbn: string,
  onData: (line: string) => void,
  onStatus: (status: SerialStatus) => void,
): WebSocket {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    onStatus("connecting");
    ws.send(JSON.stringify({ type: "serial-open", portPath, baudRate, fqbn }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string) as {
      type: string;
      line?: string;
      status?: SerialStatus;
      message?: string;
    };
    if (msg.type === "serial-data" && msg.line) {
      onData(msg.line);
    } else if (msg.type === "serial-status") {
      onStatus(msg.status ?? "disconnected");
    } else if (msg.type === "serial-error") {
      onStatus("error");
    }
  };

  ws.onerror = () => onStatus("error");
  ws.onclose = () => onStatus("disconnected");

  return ws;
}

export const useSerialStore = create<SerialState>((set, get) => ({
  status: "disconnected",
  lines: [],
  portPath: "",
  baudRate: 9600,
  graphMode: false,
  graphData: [],
  ws: null,

  connect: (portPath, baudRate, fqbn) => {
    const existing = get().ws;
    if (existing) {
      existing.close();
    }

    set({ status: "connecting" });

    const ws = connectWs(
      portPath,
      baudRate,
      fqbn,
      (line) => {
        const newLine: SerialLine = { text: line, timestamp: Date.now(), type: "rx" };
        set((s) => {
          const lines = [...s.lines, newLine].slice(-MAX_LINES);
          // Parse numeric value for graph
          const num = parseFloat(line.trim());
          const graphData = !isNaN(num)
            ? [...s.graphData, { timestamp: newLine.timestamp, value: num }].slice(-100)
            : s.graphData;
          return { lines, graphData };
        });
      },
      (status) => set({ status }),
    );

    set({ ws, portPath, baudRate });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "serial-close" }));
      ws.close();
    }
    set({ ws: null, status: "disconnected" });
  },

  send: (data) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "serial-send", data }));
      set((s) => ({
        lines: [...s.lines, { text: `> ${data}`, timestamp: Date.now(), type: "tx" as const }].slice(-MAX_LINES),
      }));
    }
  },

  clear: () => set({ lines: [], graphData: [] }),
  toggleGraphMode: () => set((s) => ({ graphMode: !s.graphMode })),
  setPortPath: (portPath) => set({ portPath }),
  setBaudRate: (baudRate) => set({ baudRate }),
}));

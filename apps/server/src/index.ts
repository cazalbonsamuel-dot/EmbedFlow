import { createServer } from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { execFile } from "child_process";
import { promisify } from "util";
import { listBoards, getBoard } from "@embedflow/hardware-db";
import { listActivities, getCategories } from "@embedflow/activity-registry";
import { validateWorkflow, type Workflow } from "@embedflow/workflow-engine";
import { generateCode, type TargetPlatform } from "@embedflow/codegen";
import { detectToolchain } from "./builder/detect-toolchain.js";
import { compileCode } from "./builder/compile-service.js";
import { flashBoard } from "./builder/flash-service.js";
import { SerialConnection } from "./serial/serial-service.js";

const execFileAsync = promisify(execFile);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// --- Existing endpoints ---

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "0.0.0" });
});

app.get("/api/boards", (_req, res) => {
  res.json(listBoards());
});

app.get("/api/boards/:id", (req, res) => {
  const board = getBoard(req.params.id);
  if (!board) {
    res.status(404).json({ error: "Carte non trouvee" });
    return;
  }
  res.json(board);
});

app.get("/api/activities", (_req, res) => {
  res.json({
    categories: getCategories(),
    activities: listActivities(),
  });
});

app.post("/api/workflows/validate", (req, res) => {
  const workflow = req.body as Workflow;
  const result = validateWorkflow(workflow);
  res.json(result);
});

// --- Sprint 7: Toolchain ---

app.get("/api/toolchain", async (_req, res) => {
  const info = await detectToolchain();
  res.json(info);
});

// --- Sprint 7: Connected boards ---

app.get("/api/boards/connected", async (_req, res) => {
  try {
    const { stdout } = await execFileAsync("arduino-cli", ["board", "list", "--format", "json"], {
      timeout: 10000,
    });
    const parsed = JSON.parse(stdout) as { detected_ports?: unknown[] };
    res.json(parsed.detected_ports ?? []);
  } catch {
    res.json([]);
  }
});

// --- Sprint 7: Compile ---

app.post("/api/compile", async (req, res) => {
  const { code, target } = req.body as { code: string; target: string };
  if (!code || !target) {
    res.status(400).json({ error: "code et target sont requis" });
    return;
  }
  const result = await compileCode({ code, target });
  res.json(result);
});

// Compile from workflow directly
app.post("/api/workflows/compile", async (req, res) => {
  const { workflow, target } = req.body as { workflow: Workflow; target: string };
  if (!workflow || !target) {
    res.status(400).json({ error: "workflow et target sont requis" });
    return;
  }
  const codeResult = generateCode(workflow, { target: target as TargetPlatform, comments: true, language: "fr" });
  const result = await compileCode({ code: codeResult.code, target });
  res.json({ ...result, code: codeResult.code });
});

// --- Sprint 7: Flash via SSE ---

app.post("/api/flash", async (req, res) => {
  const { target, portPath, code } = req.body as { target: string; portPath: string; code: string };

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  await flashBoard({ target, portPath, code }, (progress) => {
    send(progress);
  });

  res.end();
});

// --- HTTP server + WebSocket ---

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/serial" });

// Map of active serial connections per WebSocket client
const serialConnections = new Map<WebSocket, SerialConnection>();

wss.on("connection", (ws) => {
  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as {
        type: string;
        portPath?: string;
        fqbn?: string;
        baudRate?: number;
        data?: string;
      };

      if (msg.type === "serial-open") {
        const conn = new SerialConnection();
        serialConnections.set(ws, conn);

        conn.onData((line) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "serial-data", line, timestamp: Date.now() }));
          }
        });

        conn.onError((err) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "serial-error", message: err }));
          }
        });

        try {
          await conn.open(msg.portPath ?? "", msg.fqbn ?? "", msg.baudRate ?? 9600);
          ws.send(JSON.stringify({ type: "serial-status", status: "connected" }));
        } catch (err) {
          const e = err as Error;
          ws.send(JSON.stringify({ type: "serial-error", message: e.message }));
        }
      } else if (msg.type === "serial-close") {
        const conn = serialConnections.get(ws);
        if (conn) {
          await conn.close();
          serialConnections.delete(ws);
          ws.send(JSON.stringify({ type: "serial-status", status: "disconnected" }));
        }
      } else if (msg.type === "serial-send") {
        const conn = serialConnections.get(ws);
        conn?.send(msg.data ?? "");
      }
    } catch (err) {
      const e = err as Error;
      ws.send(JSON.stringify({ type: "serial-error", message: e.message }));
    }
  });

  ws.on("close", async () => {
    const conn = serialConnections.get(ws);
    if (conn) {
      await conn.close();
      serialConnections.delete(ws);
    }
  });
});

server.listen(PORT, () => {
  console.log(`EmbedFlow server running on http://localhost:${PORT}`);
  console.log(`WebSocket serial monitor on ws://localhost:${PORT}/ws/serial`);
});

import express from "express";
import cors from "cors";
import { listBoards, getBoard } from "@embedflow/hardware-db";
import { listActivities, getCategories } from "@embedflow/activity-registry";
import { validateWorkflow, type Workflow } from "@embedflow/workflow-engine";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "0.0.0" });
});

// Boards
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

// Activities
app.get("/api/activities", (_req, res) => {
  res.json({
    categories: getCategories(),
    activities: listActivities(),
  });
});

// Workflow validation
app.post("/api/workflows/validate", (req, res) => {
  const workflow = req.body as Workflow;
  const result = validateWorkflow(workflow);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`EmbedFlow server running on http://localhost:${PORT}`);
});

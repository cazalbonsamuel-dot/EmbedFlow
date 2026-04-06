import type { Node, Edge } from "@xyflow/react";
import type { Workflow } from "@embedflow/workflow-engine";
import { getActivity } from "@embedflow/activity-registry";
import type { ActivityNodeData } from "../stores/workflow-store";
import { useWorkflowStore } from "../stores/workflow-store";

export interface WorkflowExportV1 {
  version: 1;
  exportedAt: string;
  workflow: Workflow;
  nodes: Node<ActivityNodeData>[];
  edges: Edge[];
}

/**
 * Export the current workflow as a downloadable .json file.
 */
export function exportWorkflow(): void {
  const { workflow, nodes, edges } = useWorkflowStore.getState();

  const data: WorkflowExportV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workflow,
    nodes,
    edges,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = workflow.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const filename = `${safeName}-${dateStr}.embedflow.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a workflow from a .json file. Returns the validated data.
 * Throws a descriptive error if validation fails.
 */
export async function importWorkflow(file: File): Promise<WorkflowExportV1> {
  const text = await file.text();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Le fichier n'est pas un JSON valide.");
  }

  const d = data as Record<string, unknown>;

  if (!d || typeof d !== "object") {
    throw new Error("Format de fichier invalide.");
  }

  if (d.version !== 1) {
    throw new Error("Version de fichier non supportée.");
  }

  const workflow = d.workflow as Workflow | undefined;
  if (!workflow || !workflow.id || !workflow.name || !workflow.boardId) {
    throw new Error("Le workflow est incomplet ou corrompu.");
  }

  if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
    throw new Error("Les noeuds ou connexions du workflow sont manquants.");
  }

  const nodes = d.nodes as Node<ActivityNodeData>[] | undefined;
  const edges = d.edges as Edge[] | undefined;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new Error("Les données de l'éditeur sont manquantes.");
  }

  // Validate that all activity IDs exist in the registry
  const unknownActivities: string[] = [];
  for (const node of workflow.nodes) {
    if (!getActivity(node.activityId)) {
      unknownActivities.push(node.activityId);
    }
  }
  if (unknownActivities.length > 0) {
    throw new Error(
      `Activités inconnues : ${unknownActivities.join(", ")}. ` +
      `Vérifiez que vous utilisez la même version d'EmbedFlow.`,
    );
  }

  // Assign a new ID to avoid collisions
  workflow.id = crypto.randomUUID();
  workflow.updatedAt = new Date().toISOString();

  return {
    version: 1,
    exportedAt: (d.exportedAt as string) ?? new Date().toISOString(),
    workflow,
    nodes,
    edges,
  };
}

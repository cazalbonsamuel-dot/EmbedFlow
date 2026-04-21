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

export interface WorkflowDataEntry {
  workflow: Workflow;
  nodes: Node<ActivityNodeData>[];
  edges: Edge[];
}

export interface WorkflowExportV2 {
  version: 2;
  exportedAt: string;
  boardId: string;
  workflows: WorkflowDataEntry[];
  activeWorkflowId: string;
}

/**
 * Export the current project (all workflows) as a downloadable .json file.
 */
export function exportWorkflow(): void {
  const state = useWorkflowStore.getState();

  // Gather all workflows data
  const entries: WorkflowDataEntry[] = [];

  // Current active workflow
  entries.push({
    workflow: state.workflow,
    nodes: state.nodes,
    edges: state.edges,
  });

  // Other saved workflows
  for (const [id, data] of Object.entries(state.allWorkflowData)) {
    if (id !== state.activeWorkflowId) {
      entries.push(data);
    }
  }

  const data: WorkflowExportV2 = {
    version: 2,
    exportedAt: new Date().toISOString(),
    boardId: state.boardId,
    workflows: entries,
    activeWorkflowId: state.activeWorkflowId,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const mainWf = entries.find((e) => e.workflow.isMain) || entries[0];
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = mainWf.workflow.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
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
 * Import a workflow from a .json file.
 * Supports V1 (single workflow) and V2 (multi-workflow project).
 * Returns V1 format for backward compat with loadWorkflow.
 */
export async function importWorkflow(file: File): Promise<WorkflowExportV1 & { allWorkflows?: WorkflowDataEntry[] }> {
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

  // V2 import
  if (d.version === 2) {
    const v2 = d as unknown as WorkflowExportV2;
    if (!Array.isArray(v2.workflows) || v2.workflows.length === 0) {
      throw new Error("Le projet ne contient aucun workflow.");
    }

    // Validate all activities exist
    for (const entry of v2.workflows) {
      const unknownActivities: string[] = [];
      for (const node of entry.workflow.nodes) {
        if (!getActivity(node.activityId)) {
          unknownActivities.push(node.activityId);
        }
      }
      if (unknownActivities.length > 0) {
        throw new Error(
          `Activites inconnues dans "${entry.workflow.name}" : ${unknownActivities.join(", ")}. ` +
          `Verifiez que vous utilisez la meme version d'EmbedFlow.`,
        );
      }
    }

    // Find main workflow
    const mainEntry = v2.workflows.find((e) => e.workflow.isMain) || v2.workflows[0];

    // Migrate: ensure isMain and arguments
    for (const entry of v2.workflows) {
      if (entry.workflow.isMain === undefined) entry.workflow.isMain = entry === mainEntry;
      if (!entry.workflow.arguments) entry.workflow.arguments = [];
    }

    // Assign new IDs
    const idMap = new Map<string, string>();
    for (const entry of v2.workflows) {
      const newId = crypto.randomUUID();
      idMap.set(entry.workflow.id, newId);
      entry.workflow.id = newId;
      entry.workflow.updatedAt = new Date().toISOString();
    }

    // Update targetWorkflowId references
    for (const entry of v2.workflows) {
      for (const node of entry.workflow.nodes) {
        if (node.activityId === "workflow.invoke" && node.properties.targetWorkflowId) {
          const oldTarget = node.properties.targetWorkflowId as string;
          const newTarget = idMap.get(oldTarget);
          if (newTarget) {
            node.properties.targetWorkflowId = newTarget;
          }
        }
      }
    }

    return {
      version: 1,
      exportedAt: v2.exportedAt,
      workflow: mainEntry.workflow,
      nodes: mainEntry.nodes,
      edges: mainEntry.edges,
      allWorkflows: v2.workflows,
    };
  }

  // V1 import (backward compatible)
  if (d.version !== 1) {
    throw new Error("Version de fichier non supportee.");
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
    throw new Error("Les donnees de l'editeur sont manquantes.");
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
      `Activites inconnues : ${unknownActivities.join(", ")}. ` +
      `Verifiez que vous utilisez la meme version d'EmbedFlow.`,
    );
  }

  // Migrate old format
  if (workflow.isMain === undefined) workflow.isMain = true;
  if (!workflow.arguments) workflow.arguments = [];

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

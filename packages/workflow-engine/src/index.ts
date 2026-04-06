// --- Types ---

export interface WorkflowPort {
  id: string;
  name: string;
  type: "execution" | "number" | "boolean" | "string";
}

export interface WorkflowNode {
  id: string;
  activityId: string;
  position: { x: number; y: number };
  properties: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface Workflow {
  id: string;
  name: string;
  boardId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: "number" | "boolean" | "string";
  defaultValue?: unknown;
}

export interface ValidationMessage {
  nodeId?: string;
  level: "error" | "warning" | "info";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  messages: ValidationMessage[];
}

// --- Functions ---

export function createWorkflow(name: string, boardId: string): Workflow {
  return {
    id: crypto.randomUUID(),
    name,
    boardId,
    nodes: [],
    edges: [],
    variables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function validateWorkflow(workflow: Workflow): ValidationResult {
  const messages: ValidationMessage[] = [];

  if (!workflow.name.trim()) {
    messages.push({ level: "error", message: "Le nom du workflow est requis." });
  }

  if (!workflow.boardId) {
    messages.push({ level: "error", message: "Aucune carte cible sélectionnée." });
  }

  // Check for disconnected nodes
  const connectedNodeIds = new Set<string>();
  for (const edge of workflow.edges) {
    connectedNodeIds.add(edge.sourceNodeId);
    connectedNodeIds.add(edge.targetNodeId);
  }

  for (const node of workflow.nodes) {
    if (workflow.nodes.length > 1 && !connectedNodeIds.has(node.id)) {
      messages.push({
        nodeId: node.id,
        level: "warning",
        message: `Le bloc "${node.activityId}" n'est relié à rien.`,
      });
    }
  }

  return {
    valid: messages.every((m) => m.level !== "error"),
    messages,
  };
}

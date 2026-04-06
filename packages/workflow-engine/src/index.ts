// --- Simulation ---
export type {
  SimulationStatus,
  PinState,
  SerialLine,
  LedState,
  ServoState,
  BuzzerState,
  LcdState,
  SimulationState,
  SimulationInputs,
  SimulationEventType,
  SimulationEvent,
  SimulationEventListener,
} from "./simulator-types.js";

export { WorkflowSimulator } from "./simulator.js";

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
  estimatedRam?: number;
  estimatedFlash?: number;
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

  // 1. Basic checks
  if (!workflow.name.trim()) {
    messages.push({ level: "error", message: "Le nom du workflow est requis." });
  }

  if (!workflow.boardId) {
    messages.push({ level: "error", message: "Aucune carte cible selectionnee." });
  }

  // 2. Pin conflict detection
  const pinUsage = new Map<number, { nodeId: string; activityId: string }[]>();
  for (const node of workflow.nodes) {
    const props = node.properties;
    // Collect all pin-type properties
    const pinProps = ["pin", "pin_trigger", "pin_echo", "pin_vitesse", "pin_direction"];
    for (const propName of pinProps) {
      const pinVal = props[propName];
      if (pinVal !== undefined && pinVal !== null && typeof pinVal === "number") {
        if (!pinUsage.has(pinVal)) pinUsage.set(pinVal, []);
        pinUsage.get(pinVal)!.push({ nodeId: node.id, activityId: node.activityId });
      }
    }
  }

  for (const [pin, users] of pinUsage) {
    if (users.length > 1) {
      const names = users.map((u) => u.activityId).join(", ");
      for (const user of users) {
        messages.push({
          nodeId: user.nodeId,
          level: "error",
          message: `Le pin ${pin} est utilise par plusieurs blocs : ${names}`,
        });
      }
    }
  }

  // 3. Disconnected nodes
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
        message: `Le bloc "${node.activityId}" n'est relie a rien.`,
      });
    }
  }

  // 4. Cycle detection (DFS)
  const adjacency = new Map<string, string[]>();
  for (const node of workflow.nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of workflow.edges) {
    adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  let hasCycle = false;

  function dfs(nodeId: string) {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const neighbor of adjacency.get(nodeId) || []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (inStack.has(neighbor)) {
        hasCycle = true;
      }
    }
    inStack.delete(nodeId);
  }

  for (const node of workflow.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  if (hasCycle) {
    messages.push({
      level: "error",
      message: "Boucle infinie detectee : des blocs forment un cycle.",
    });
  }

  // 5. RAM/Flash estimation (rough)
  const BASE_RAM = 200; // Arduino runtime
  const BASE_FLASH = 500;
  const PER_NODE_RAM = 20;
  const PER_NODE_FLASH = 100;
  const estimatedRam = BASE_RAM + workflow.nodes.length * PER_NODE_RAM;
  const estimatedFlash = BASE_FLASH + workflow.nodes.length * PER_NODE_FLASH;

  return {
    valid: messages.every((m) => m.level !== "error"),
    messages,
    estimatedRam,
    estimatedFlash,
  };
}

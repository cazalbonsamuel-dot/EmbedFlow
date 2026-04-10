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

export type { Project } from "./project.js";

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

export interface WorkflowArgument {
  id: string;
  name: string;
  type: "number" | "boolean" | "string";
  direction: "in" | "out" | "in_out";
  defaultValue?: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  boardId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  arguments: WorkflowArgument[];
  isMain: boolean;
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

export function createWorkflow(name: string, boardId: string, isMain = true): Workflow {
  return {
    id: crypto.randomUUID(),
    name,
    boardId,
    nodes: [],
    edges: [],
    variables: [],
    arguments: [],
    isMain,
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
  // Activities that can share the same pin without electrical conflict
  const COMPATIBLE_PAIRS: Record<string, string[]> = {
    "gpio.turn_on": ["gpio.turn_off", "gpio.vary_intensity"],
    "gpio.turn_off": ["gpio.turn_on", "gpio.vary_intensity"],
    "gpio.vary_intensity": ["gpio.turn_on", "gpio.turn_off"],
  };

  const pinUsage = new Map<number, { nodeId: string; activityId: string }[]>();
  for (const node of workflow.nodes) {
    const props = node.properties;
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
      // Check if all users are mutually compatible (can share the pin)
      const allCompatible = users.every((user) =>
        users
          .filter((other) => other.nodeId !== user.nodeId)
          .every((other) => (COMPATIBLE_PAIRS[user.activityId] ?? []).includes(other.activityId)),
      );
      if (!allCompatible) {
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

// --- Project-level validation (multi-workflow) ---

export function validateProject(workflows: Workflow[]): ValidationResult {
  const messages: ValidationMessage[] = [];

  // Exactly one Main workflow
  const mains = workflows.filter((w) => w.isMain);
  if (mains.length === 0) {
    messages.push({ level: "error", message: "Le projet doit contenir un workflow principal (Main)." });
  } else if (mains.length > 1) {
    messages.push({ level: "error", message: "Le projet ne peut avoir qu'un seul workflow principal (Main)." });
  }

  // Check for cycle in invocations (A calls B, B calls A)
  const invocationGraph = new Map<string, string[]>();
  for (const wf of workflows) {
    invocationGraph.set(wf.id, []);
    for (const node of wf.nodes) {
      if (node.activityId === "workflow.invoke") {
        const targetId = node.properties.targetWorkflowId as string | undefined;
        if (targetId) {
          invocationGraph.get(wf.id)!.push(targetId);
        }
      }
    }
  }

  // DFS cycle detection on invocation graph
  const visited = new Set<string>();
  const inStack = new Set<string>();
  let hasCycle = false;

  function dfs(id: string) {
    visited.add(id);
    inStack.add(id);
    for (const target of invocationGraph.get(id) || []) {
      if (!visited.has(target)) {
        dfs(target);
      } else if (inStack.has(target)) {
        hasCycle = true;
      }
    }
    inStack.delete(id);
  }

  for (const wf of workflows) {
    if (!visited.has(wf.id)) dfs(wf.id);
  }

  if (hasCycle) {
    messages.push({
      level: "error",
      message: "Cycle d'invocation detecte : des sous-workflows s'appellent mutuellement.",
    });
  }

  // Check referenced sub-workflows exist
  const workflowIds = new Set(workflows.map((w) => w.id));
  for (const wf of workflows) {
    for (const node of wf.nodes) {
      if (node.activityId === "workflow.invoke") {
        const targetId = node.properties.targetWorkflowId as string | undefined;
        if (targetId && !workflowIds.has(targetId)) {
          messages.push({
            nodeId: node.id,
            level: "error",
            message: `Le sous-workflow reference n'existe plus.`,
          });
        }
      }
    }
  }

  return {
    valid: messages.every((m) => m.level !== "error"),
    messages,
  };
}

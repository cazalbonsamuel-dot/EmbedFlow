import { getActivity } from "@embedflow/activity-registry";
import type { WiringInstruction } from "@embedflow/activity-registry";
import type { ActivityNodeData } from "../stores/workflow-store";
import type { Node } from "@xyflow/react";

export interface AggregatedConnection {
  id: string;
  from: string;
  to: string;
  color: string;
  label: string;
  blockLabel: string;
  blockIcon: string;
  nodeId: string;
}

export interface WiringGroup {
  nodeId: string;
  blockLabel: string;
  blockIcon: string;
  connections: AggregatedConnection[];
}

export function aggregateWiring(
  nodes: Node<ActivityNodeData>[],
  boardId: string,
): AggregatedConnection[] {
  const seen = new Set<string>();
  const result: AggregatedConnection[] = [];

  for (const node of nodes) {
    const { activityId, label, icon, properties } = node.data;
    const activity = getActivity(activityId);
    if (!activity) continue;

    let instructions: WiringInstruction[] = [];
    try {
      instructions = activity.wiring(properties, { id: boardId });
    } catch {
      continue;
    }

    for (const instr of instructions) {
      const key = `${instr.from}→${instr.to}`;
      if (seen.has(key)) continue;
      seen.add(key);

      result.push({
        id: `${node.id}-${key}`,
        from: instr.from,
        to: instr.to,
        color: instr.color,
        label: instr.label,
        blockLabel: label,
        blockIcon: icon,
        nodeId: node.id,
      });
    }
  }

  return result;
}

export function groupWiring(connections: AggregatedConnection[]): WiringGroup[] {
  const map = new Map<string, WiringGroup>();
  for (const conn of connections) {
    if (!map.has(conn.nodeId)) {
      map.set(conn.nodeId, {
        nodeId: conn.nodeId,
        blockLabel: conn.blockLabel,
        blockIcon: conn.blockIcon,
        connections: [],
      });
    }
    map.get(conn.nodeId)!.connections.push(conn);
  }
  return Array.from(map.values());
}

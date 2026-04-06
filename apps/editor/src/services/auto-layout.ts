import Dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { ActivityNodeData } from "../stores/workflow-store";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;

export function autoLayout(
  nodes: Node<ActivityNodeData>[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
): Node<ActivityNodeData>[] {
  if (nodes.length === 0) return nodes;

  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

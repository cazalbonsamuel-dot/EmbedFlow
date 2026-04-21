import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";
import type { ActivityNodeData } from "./workflow-store";
import { useWorkflowStore } from "./workflow-store";

interface ClipboardState {
  copiedNodes: Node<ActivityNodeData>[];
  copiedEdges: Edge[];

  copySelection: () => void;
  paste: () => void;
  hasCopiedContent: () => boolean;
}

const PASTE_OFFSET = 40;

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  copiedNodes: [],
  copiedEdges: [],

  copySelection: () => {
    const { nodes, edges } = useWorkflowStore.getState();
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const relatedEdges = edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
    );

    set({
      copiedNodes: structuredClone(selectedNodes),
      copiedEdges: structuredClone(relatedEdges),
    });
  },

  paste: () => {
    const { copiedNodes, copiedEdges } = get();
    if (copiedNodes.length === 0) return;

    // Build old-to-new ID mapping
    const idMap = new Map<string, string>();
    copiedNodes.forEach((n) => {
      idMap.set(n.id, crypto.randomUUID());
    });

    // Clone nodes with new IDs and offset positions
    const newNodes: Node<ActivityNodeData>[] = copiedNodes.map((n) => ({
      ...structuredClone(n),
      id: idMap.get(n.id)!,
      position: {
        x: n.position.x + PASTE_OFFSET,
        y: n.position.y + PASTE_OFFSET,
      },
      selected: false,
    }));

    // Clone edges with new IDs and remapped source/target
    const newEdges: Edge[] = copiedEdges.map((e) => ({
      ...structuredClone(e),
      id: crypto.randomUUID(),
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
      selected: false,
    }));

    useWorkflowStore.getState().pasteNodes(newNodes, newEdges);

    // Update clipboard with the new positions for repeated pastes
    set({
      copiedNodes: newNodes.map((n) => structuredClone(n)),
      copiedEdges: newEdges.map((e) => structuredClone(e)),
    });
  },

  hasCopiedContent: () => get().copiedNodes.length > 0,
}));

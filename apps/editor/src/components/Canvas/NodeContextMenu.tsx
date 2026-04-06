import { useEffect, useRef } from "react";
import { useWorkflowStore } from "../../stores/workflow-store";
import { useClipboardStore } from "../../stores/clipboard-store";

interface NodeContextMenuProps {
  nodeId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function NodeContextMenu({ nodeId, position, onClose }: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDuplicate = () => {
    // Select the node, copy it, then paste
    const { nodes, edges } = useWorkflowStore.getState();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const newId = crypto.randomUUID();
    const newNode = {
      ...structuredClone(node),
      id: newId,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
    };

    useWorkflowStore.getState().pasteNodes([newNode], []);
    setSelectedNode(newId);
    onClose();
  };

  const handleCopy = () => {
    // Temporarily select this node for copy
    const { nodes } = useWorkflowStore.getState();
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      // Set selected, copy, then restore
      useClipboardStore.setState({
        copiedNodes: [structuredClone({ ...node, selected: true })],
        copiedEdges: [],
      });
    }
    onClose();
  };

  const handleDelete = () => {
    removeNode(nodeId);
    onClose();
  };

  const handleSelect = () => {
    setSelectedNode(nodeId);
    onClose();
  };

  const items = [
    { label: "Propriétés", icon: "⚙️", action: handleSelect },
    { label: "Dupliquer", icon: "📋", action: handleDuplicate, shortcut: "Ctrl+D" },
    { label: "Copier", icon: "📄", action: handleCopy, shortcut: "Ctrl+C" },
    { divider: true },
    { label: "Supprimer", icon: "🗑️", action: handleDelete, shortcut: "Del", danger: true },
  ] as const;

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, i) =>
        "divider" in item ? (
          <div key={i} className="border-t border-gray-700 my-1" />
        ) : (
          <button
            key={i}
            onClick={item.action}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
              "danger" in item && item.danger
                ? "text-red-400 hover:bg-red-950/30"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {"shortcut" in item && item.shortcut && (
              <span className="text-[10px] text-gray-600 ml-4">{item.shortcut}</span>
            )}
          </button>
        ),
      )}
    </div>
  );
}

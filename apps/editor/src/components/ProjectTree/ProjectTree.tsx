import { useState, useRef, useEffect } from "react";
import { getActivity } from "@embedflow/activity-registry";
import { useWorkflowStore } from "../../stores/workflow-store";
import type { SubWorkflowMeta } from "../../stores/workflow-store";

export default function ProjectTree() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const nodes = useWorkflowStore((s) => s.nodes);
  const projectWorkflows = useWorkflowStore((s) => s.projectWorkflows);
  const allWorkflowData = useWorkflowStore((s) => s.allWorkflowData);
  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId);
  const switchWorkflow = useWorkflowStore((s) => s.switchWorkflow);
  const addSubWorkflow = useWorkflowStore((s) => s.addSubWorkflow);
  const deleteSubWorkflow = useWorkflowStore((s) => s.deleteSubWorkflow);
  const renameWorkflow = useWorkflowStore((s) => s.renameWorkflow);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const boardId = useWorkflowStore((s) => s.boardId);

  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set([activeWorkflowId]));
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number; type: "workflow" | "node" } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Auto-expand active workflow
  useEffect(() => {
    setExpandedWorkflows((prev) => {
      const next = new Set(prev);
      next.add(activeWorkflowId);
      return next;
    });
  }, [activeWorkflowId]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu]);

  const toggleExpand = (id: string) => {
    setExpandedWorkflows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, id: string, type: "workflow" | "node") => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id, x: e.clientX, y: e.clientY, type });
  };

  const handleStartRename = (id: string) => {
    const wf = projectWorkflows.find((w) => w.id === id);
    if (!wf) return;
    setRenamingId(id);
    setRenameValue(wf.name);
    setContextMenu(null);
  };

  const handleFinishRename = () => {
    if (renamingId && renameValue.trim()) {
      renameWorkflow(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const getWorkflowNodes = (wfId: string) => {
    if (wfId === activeWorkflowId) return nodes;
    return allWorkflowData[wfId]?.nodes || [];
  };

  const getWorkflowArgs = (wfId: string) => {
    if (wfId === activeWorkflowId) return workflow.arguments || [];
    return allWorkflowData[wfId]?.workflow.arguments || [];
  };

  // Sort: Main first, then alphabetical
  const sortedWorkflows = [...projectWorkflows].sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Projet</span>
        <button
          onClick={() => addSubWorkflow(`Sous-workflow ${projectWorkflows.length}`)}
          className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-800"
          title="Nouveau sous-workflow"
        >
          + Nouveau
        </button>
      </div>

      {/* Board info */}
      <div className="px-3 py-1.5 border-b border-gray-800/50 flex items-center gap-2">
        <span className="text-[10px] text-gray-600">Carte :</span>
        <span className="text-[10px] text-gray-400 font-medium">{boardId}</span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {sortedWorkflows.map((wfMeta) => {
          const isActive = wfMeta.id === activeWorkflowId;
          const isExpanded = expandedWorkflows.has(wfMeta.id);
          const wfNodes = getWorkflowNodes(wfMeta.id);
          const wfArgs = getWorkflowArgs(wfMeta.id);

          return (
            <div key={wfMeta.id}>
              {/* Workflow row */}
              <div
                className={`flex items-center gap-1 px-2 py-1 cursor-pointer group transition-colors ${
                  isActive
                    ? "bg-blue-900/20 text-gray-200"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
                }`}
                onClick={() => {
                  if (!isActive) switchWorkflow(wfMeta.id);
                  toggleExpand(wfMeta.id);
                }}
                onContextMenu={(e) => handleContextMenu(e, wfMeta.id, "workflow")}
                onDoubleClick={() => handleStartRename(wfMeta.id)}
              >
                {/* Expand arrow */}
                <span className="text-[9px] w-3 text-center text-gray-600 shrink-0">
                  {wfNodes.length > 0 || wfArgs.length > 0 ? (isExpanded ? "▼" : "▶") : ""}
                </span>

                {/* Icon */}
                <span className="text-xs shrink-0">
                  {wfMeta.isMain ? "🏠" : "📎"}
                </span>

                {/* Name */}
                {renamingId === wfMeta.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFinishRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="flex-1 bg-gray-700 text-gray-200 text-xs px-1 py-0 rounded border border-blue-500 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className={`flex-1 text-xs truncate ${isActive ? "font-medium" : ""}`}>
                    {wfMeta.name}
                  </span>
                )}

                {/* Badge: node count */}
                <span className="text-[9px] text-gray-600 shrink-0">
                  {wfNodes.length}
                </span>
              </div>

              {/* Children */}
              {isExpanded && (
                <div className="ml-3">
                  {/* Arguments section for sub-workflows */}
                  {!wfMeta.isMain && wfArgs.length > 0 && (
                    <div className="ml-3 border-l border-gray-800/50">
                      <div className="px-2 py-0.5 text-[9px] text-gray-600 uppercase tracking-wider font-semibold">
                        Arguments
                      </div>
                      {wfArgs.map((arg) => (
                        <div
                          key={arg.id}
                          className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-gray-500"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            arg.direction === "in" ? "bg-blue-500" : arg.direction === "out" ? "bg-green-500" : "bg-yellow-500"
                          }`} />
                          <span className="truncate">{arg.name}</span>
                          <span className="text-[9px] text-gray-600 shrink-0">{arg.type}</span>
                          <span className="text-[9px] text-gray-700 shrink-0">
                            {arg.direction === "in" ? "IN" : arg.direction === "out" ? "OUT" : "I/O"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Nodes */}
                  {wfNodes.length > 0 && (
                    <div className="ml-3 border-l border-gray-800/50">
                      {wfNodes.map((node) => {
                        const activity = getActivity(node.data.activityId);
                        const isNodeActive = isActive && selectedNodeId === node.id;
                        const isInvokeNode = node.data.activityId === "workflow.invoke";
                        const targetName = isInvokeNode
                          ? projectWorkflows.find((w) => w.id === node.data.properties.targetWorkflowId)?.name
                          : null;

                        return (
                          <div
                            key={node.id}
                            className={`flex items-center gap-1.5 px-2 py-0.5 cursor-pointer transition-colors rounded-r-sm ${
                              isNodeActive
                                ? "bg-blue-900/30 text-gray-200"
                                : "text-gray-500 hover:bg-gray-800/40 hover:text-gray-400"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isActive) switchWorkflow(wfMeta.id);
                              setSelectedNode(node.id);
                            }}
                            onContextMenu={(e) => handleContextMenu(e, node.id, "node")}
                          >
                            <span className="text-[10px] shrink-0">{activity?.icon || "?"}</span>
                            <span className="text-[11px] truncate flex-1">
                              {isInvokeNode && targetName
                                ? `Appeler: ${targetName}`
                                : node.data.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty state */}
                  {wfNodes.length === 0 && wfArgs.length === 0 && (
                    <div className="ml-6 px-2 py-1 text-[10px] text-gray-700 italic">
                      Vide
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === "workflow" && (
            <>
              <button
                onClick={() => handleStartRename(contextMenu.id)}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Renommer
              </button>
              <button
                onClick={() => {
                  switchWorkflow(contextMenu.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Ouvrir
              </button>
              {!projectWorkflows.find((w) => w.id === contextMenu.id)?.isMain && (
                <button
                  onClick={() => {
                    deleteSubWorkflow(contextMenu.id);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700 transition-colors"
                >
                  Supprimer
                </button>
              )}
            </>
          )}
          {contextMenu.type === "node" && (
            <button
              onClick={() => {
                setSelectedNode(contextMenu.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Selectionner
            </button>
          )}
        </div>
      )}
    </div>
  );
}

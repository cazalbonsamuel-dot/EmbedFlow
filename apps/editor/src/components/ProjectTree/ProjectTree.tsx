import { useState, useRef, useEffect } from "react";
import { getActivity } from "@embedflow/activity-registry";
import { useWorkflowStore } from "../../stores/workflow-store";

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

  const sortedWorkflows = [...projectWorkflows].sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--color-raised)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{ height: "32px", borderBottom: "1px solid var(--border-dim)" }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
        >
          Projet
        </span>
        <button
          onClick={() => addSubWorkflow(`Sous-workflow ${projectWorkflows.length}`)}
          className="text-[10px] px-1.5 py-0.5 rounded transition-colors duration-100"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)";
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "";
            (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
          }}
          title="Nouveau sous-workflow"
        >
          + Nouveau
        </button>
      </div>

      {/* Board badge */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 shrink-0"
        style={{ borderBottom: "1px solid var(--border-dim)" }}
      >
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Carte</span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{ background: "var(--color-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
        >
          {boardId}
        </span>
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
                className="flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors duration-100"
                style={{
                  background: isActive ? "var(--accent-muted)" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                }}
                onClick={() => {
                  if (!isActive) switchWorkflow(wfMeta.id);
                  toggleExpand(wfMeta.id);
                }}
                onContextMenu={(e) => handleContextMenu(e, wfMeta.id, "workflow")}
                onDoubleClick={() => handleStartRename(wfMeta.id)}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Expand arrow */}
                <span
                  className="text-[9px] w-3 text-center shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {wfNodes.length > 0 || wfArgs.length > 0 ? (isExpanded ? "▼" : "▶") : ""}
                </span>

                {/* Icon */}
                <span className="text-[11px] shrink-0" style={{ color: "var(--text-tertiary)" }}>
                  {wfMeta.isMain ? "⬡" : "◈"}
                </span>

                {/* Name / rename input */}
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
                    className="flex-1 text-xs px-1 py-0 rounded focus:outline-none"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--accent)",
                      color: "var(--text-primary)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="flex-1 text-xs truncate"
                    style={{ fontWeight: isActive ? 500 : 400 }}
                  >
                    {wfMeta.name}
                  </span>
                )}

                {/* Node count */}
                <span className="text-[9px] shrink-0" style={{ color: "var(--text-tertiary)" }}>
                  {wfNodes.length > 0 ? wfNodes.length : ""}
                </span>
              </div>

              {/* Children */}
              {isExpanded && (
                <div style={{ marginLeft: "12px" }}>
                  {/* Arguments */}
                  {!wfMeta.isMain && wfArgs.length > 0 && (
                    <div style={{ marginLeft: "12px", borderLeft: "1px solid var(--border-dim)" }}>
                      <div
                        className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold"
                        style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
                      >
                        Arguments
                      </div>
                      {wfArgs.map((arg) => (
                        <div
                          key={arg.id}
                          className="flex items-center gap-1.5 px-2 py-0.5 text-[11px]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: arg.direction === "in"
                                ? "var(--accent)"
                                : arg.direction === "out"
                                  ? "var(--success)"
                                  : "var(--warning)",
                            }}
                          />
                          <span className="truncate" style={{ color: "var(--text-secondary)" }}>{arg.name}</span>
                          <span className="text-[9px] shrink-0" style={{ color: "var(--text-tertiary)" }}>{arg.type}</span>
                          <span className="text-[9px] shrink-0 font-mono" style={{ color: "var(--text-tertiary)" }}>
                            {arg.direction === "in" ? "IN" : arg.direction === "out" ? "OUT" : "I/O"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Nodes */}
                  {wfNodes.length > 0 && (
                    <div style={{ marginLeft: "12px", borderLeft: "1px solid var(--border-dim)" }}>
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
                            className="flex items-center gap-1.5 px-2 py-0.5 cursor-pointer transition-colors duration-100 rounded-r"
                            style={{
                              background: isNodeActive ? "var(--color-overlay)" : "transparent",
                              color: isNodeActive ? "var(--text-primary)" : "var(--text-tertiary)",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isActive) switchWorkflow(wfMeta.id);
                              setSelectedNode(node.id);
                            }}
                            onContextMenu={(e) => handleContextMenu(e, node.id, "node")}
                            onMouseEnter={(e) => {
                              if (!isNodeActive) {
                                (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)";
                                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isNodeActive) {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                                (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                              }
                            }}
                          >
                            <span className="text-[10px] shrink-0">{activity?.icon || "·"}</span>
                            <span className="text-[11px] truncate flex-1">
                              {isInvokeNode && targetName ? `→ ${targetName}` : node.data.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty */}
                  {wfNodes.length === 0 && wfArgs.length === 0 && (
                    <div
                      className="px-5 py-1 text-[10px] italic"
                      style={{ color: "var(--text-tertiary)" }}
                    >
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
          className="fixed z-50 py-1 rounded shadow-xl min-w-[130px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: "var(--color-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          {contextMenu.type === "workflow" && (
            <>
              <button
                onClick={() => handleStartRename(contextMenu.id)}
                className="w-full text-left px-3 py-1.5 text-xs transition-colors duration-100"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                Renommer
              </button>
              <button
                onClick={() => { switchWorkflow(contextMenu.id); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-xs transition-colors duration-100"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                Ouvrir
              </button>
              {!projectWorkflows.find((w) => w.id === contextMenu.id)?.isMain && (
                <button
                  onClick={() => { deleteSubWorkflow(contextMenu.id); setContextMenu(null); }}
                  className="w-full text-left px-3 py-1.5 text-xs transition-colors duration-100"
                  style={{ color: "var(--error)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--error-muted)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  Supprimer
                </button>
              )}
            </>
          )}
          {contextMenu.type === "node" && (
            <button
              onClick={() => { setSelectedNode(contextMenu.id); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-xs transition-colors duration-100"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              Sélectionner
            </button>
          )}
        </div>
      )}
    </div>
  );
}

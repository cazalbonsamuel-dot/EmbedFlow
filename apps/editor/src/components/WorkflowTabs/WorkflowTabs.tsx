import { useState, useRef, useEffect } from "react";
import { useWorkflowStore } from "../../stores/workflow-store";

export default function WorkflowTabs() {
  const projectWorkflows = useWorkflowStore((s) => s.projectWorkflows);
  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId);
  const switchWorkflow = useWorkflowStore((s) => s.switchWorkflow);
  const addSubWorkflow = useWorkflowStore((s) => s.addSubWorkflow);
  const deleteSubWorkflow = useWorkflowStore((s) => s.deleteSubWorkflow);
  const renameWorkflow = useWorkflowStore((s) => s.renameWorkflow);

  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

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

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const handleAdd = () => {
    const name = `Sous-workflow ${projectWorkflows.length}`;
    addSubWorkflow(name);
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

  const handleDelete = (id: string) => {
    setContextMenu(null);
    deleteSubWorkflow(id);
  };

  return (
    <div
      className="flex items-center px-2 shrink-0"
      style={{
        height: "32px",
        background: "var(--color-raised)",
        borderBottom: "1px solid var(--border-dim)",
      }}
    >
      <div className="flex items-center gap-px overflow-x-auto flex-1">
        {projectWorkflows.map((wf) => {
          const isActive = wf.id === activeWorkflowId;

          return (
            <button
              key={wf.id}
              onClick={() => switchWorkflow(wf.id)}
              onContextMenu={(e) => handleContextMenu(e, wf.id)}
              className="flex items-center gap-1.5 px-2.5 rounded text-xs transition-colors duration-100 whitespace-nowrap shrink-0"
              style={{
                height: "24px",
                background: isActive ? "var(--color-overlay)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                }
              }}
            >
              <span className="text-[10px] opacity-60">{wf.isMain ? "⬡" : "◈"}</span>

              {renamingId === wf.id ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFinishRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="text-xs px-1 py-0 rounded w-24 focus:outline-none"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--accent)",
                    color: "var(--text-primary)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate max-w-[120px]">{wf.name}</span>
              )}

              {isActive && (
                <span
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          );
        })}

        <button
          onClick={handleAdd}
          className="w-6 h-6 flex items-center justify-center rounded text-sm transition-colors duration-100 ml-0.5 shrink-0"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "";
            (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
          }}
          title="Ajouter un sous-workflow"
        >
          +
        </button>
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
          <button
            onClick={() => handleStartRename(contextMenu.id)}
            className="w-full text-left px-3 py-1.5 text-xs transition-colors duration-100"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
          >
            Renommer
          </button>
          {!projectWorkflows.find((w) => w.id === contextMenu.id)?.isMain && (
            <button
              onClick={() => handleDelete(contextMenu.id)}
              className="w-full text-left px-3 py-1.5 text-xs transition-colors duration-100"
              style={{ color: "var(--error)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--error-muted)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Close context menu on click outside
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

  // Only show tabs bar if there's more than 1 workflow
  if (projectWorkflows.length <= 1) {
    return (
      <div className="flex items-center border-b border-gray-800 bg-gray-900/70 px-2 shrink-0">
        <div className="flex items-center gap-1 py-1">
          <span className="px-3 py-1 text-xs font-medium text-gray-300 bg-gray-800 rounded-t-md border border-gray-700 border-b-0 flex items-center gap-1.5">
            <span className="text-[10px]">🏠</span>
            Main
          </span>
          <button
            onClick={handleAdd}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
            title="Ajouter un sous-workflow"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center border-b border-gray-800 bg-gray-900/70 px-2 shrink-0">
      <div className="flex items-center gap-0.5 py-1 overflow-x-auto">
        {projectWorkflows.map((wf) => {
          const isActive = wf.id === activeWorkflowId;

          return (
            <button
              key={wf.id}
              onClick={() => switchWorkflow(wf.id)}
              onContextMenu={(e) => handleContextMenu(e, wf.id)}
              className={`group flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-t-md border transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-gray-800 text-gray-200 border-gray-700 border-b-gray-800"
                  : "bg-transparent text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              {wf.isMain && <span className="text-[10px]">🏠</span>}
              {!wf.isMain && <span className="text-[10px] text-blue-400">📎</span>}

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
                  className="bg-gray-700 text-gray-200 text-xs px-1 py-0 rounded border border-blue-500 focus:outline-none w-28"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate max-w-[120px]">{wf.name}</span>
              )}
            </button>
          );
        })}

        <button
          onClick={handleAdd}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors ml-1"
          title="Ajouter un sous-workflow"
        >
          +
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleStartRename(contextMenu.id)}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Renommer
          </button>
          {!projectWorkflows.find((w) => w.id === contextMenu.id)?.isMain && (
            <button
              onClick={() => handleDelete(contextMenu.id)}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700 transition-colors"
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

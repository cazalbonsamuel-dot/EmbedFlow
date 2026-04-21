import { useState, useEffect, useRef } from "react";
import { useProjectStore } from "../../stores/project-store";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function ProjectSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const createProject = useProjectStore((s) => s.createProject);
  const switchProject = useProjectStore((s) => s.switchProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors max-w-[180px]"
      >
        <span className="text-xs">📂</span>
        <span className="truncate text-xs">
          {currentProject?.name ?? "Projets"}
        </span>
        <span className="text-gray-500 text-[10px]">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Project list */}
          <div className="max-h-64 overflow-y-auto">
            {projects.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-500">Aucun projet sauvegardé.</p>
            ) : (
              projects
                .slice()
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((project) => {
                  const isCurrent = project.id === currentProjectId;
                  return (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between px-4 py-2.5 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                        isCurrent ? "bg-blue-950/30 border-l-2 border-blue-500" : "border-l-2 border-transparent"
                      }`}
                      onClick={() => {
                        switchProject(project.id);
                        setOpen(false);
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-200 truncate">
                            {project.name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-900/50 text-blue-400 shrink-0">
                              actuel
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-500">{project.boardId}</span>
                          <span className="text-[10px] text-gray-600">•</span>
                          <span className="text-[10px] text-gray-500">
                            {timeAgo(project.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Supprimer "${project.name}" ? Cette action est irréversible.`)) {
                            deleteProject(project.id);
                          }
                        }}
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors shrink-0 ml-2"
                        title="Supprimer le projet"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })
            )}
          </div>

          {/* New project button */}
          <div className="border-t border-gray-700 px-4 py-2.5">
            <button
              onClick={() => {
                createProject();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
            >
              <span>+</span>
              <span>Nouveau projet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

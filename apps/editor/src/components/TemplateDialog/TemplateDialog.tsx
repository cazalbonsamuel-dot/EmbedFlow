import { useEffect } from "react";
import { getTemplates, type WorkflowTemplate } from "../../services/templates";
import { useWorkflowStore } from "../../stores/workflow-store";
import { useProjectStore } from "../../stores/project-store";

interface TemplateDialogProps {
  open: boolean;
  onClose: () => void;
}

const difficultyLabels: Record<string, { label: string; color: string }> = {
  debutant: { label: "Débutant", color: "bg-green-900/50 text-green-400" },
  intermediaire: { label: "Intermédiaire", color: "bg-yellow-900/50 text-yellow-400" },
  avance: { label: "Avancé", color: "bg-red-900/50 text-red-400" },
};

export default function TemplateDialog({ open, onClose }: TemplateDialogProps) {
  const templates = getTemplates();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSelect = (template: WorkflowTemplate) => {
    // Assign fresh IDs
    const workflow = {
      ...template.workflow,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useWorkflowStore.getState().loadWorkflow(workflow, template.nodes, template.edges);
    useProjectStore.getState().syncCurrentProject();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h2 className="text-base font-semibold text-gray-100">
              Commencer avec un template
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((template) => {
              const diff = difficultyLabels[template.difficulty];
              return (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="text-left p-4 rounded-lg border border-gray-800 bg-gray-800/50 hover:border-blue-600 hover:bg-blue-950/20 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-200 group-hover:text-blue-300 transition-colors">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${diff.color}`}>
                          {diff.label}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {template.workflow.nodes.length} blocs
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {template.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 shrink-0">
          <p className="text-[10px] text-gray-600 text-center">
            Le template remplace le workflow actuel. Pensez à sauvegarder avant.
          </p>
        </div>
      </div>
    </div>
  );
}

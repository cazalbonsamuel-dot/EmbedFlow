import type { WorkflowArgument } from "@embedflow/workflow-engine";
import { useWorkflowStore } from "../../stores/workflow-store";

const typeOptions = [
  { value: "number", label: "Nombre" },
  { value: "boolean", label: "Booleen" },
  { value: "string", label: "Texte" },
] as const;

const directionOptions = [
  { value: "in", label: "Entree" },
  { value: "out", label: "Sortie" },
  { value: "in_out", label: "Entree/Sortie" },
] as const;

export default function WorkflowArgumentsEditor() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const updateWorkflowArguments = useWorkflowStore((s) => s.updateWorkflowArguments);

  if (workflow.isMain) return null;

  const args = workflow.arguments || [];

  const addArgument = () => {
    const newArg: WorkflowArgument = {
      id: crypto.randomUUID(),
      name: `arg${args.length + 1}`,
      type: "number",
      direction: "in",
    };
    updateWorkflowArguments([...args, newArg]);
  };

  const updateArgument = (id: string, changes: Partial<WorkflowArgument>) => {
    updateWorkflowArguments(
      args.map((a) => (a.id === id ? { ...a, ...changes } : a)),
    );
  };

  const removeArgument = (id: string) => {
    updateWorkflowArguments(args.filter((a) => a.id !== id));
  };

  return (
    <aside className="w-72 border-l border-gray-800 bg-gray-900/30 flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 bg-sky-600 text-white">
        <span className="text-xl">📎</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{workflow.name}</div>
          <div className="text-xs opacity-75">Arguments du sous-workflow</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-[11px] text-gray-500">
          Definissez les arguments d'entree et de sortie de ce sous-workflow.
          Ils deviendront des ports sur le bloc "Appeler un sous-workflow".
        </p>

        {args.map((arg) => (
          <div
            key={arg.id}
            className="bg-gray-800/50 rounded-lg p-3 space-y-2 border border-gray-700/50"
          >
            {/* Name */}
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Nom</label>
              <input
                value={arg.name}
                onChange={(e) => updateArgument(arg.id, { name: e.target.value })}
                className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              {/* Type */}
              <div className="flex-1">
                <label className="block text-[10px] text-gray-500 mb-0.5">Type</label>
                <select
                  value={arg.type}
                  onChange={(e) =>
                    updateArgument(arg.id, { type: e.target.value as WorkflowArgument["type"] })
                  }
                  className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
                >
                  {typeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Direction */}
              <div className="flex-1">
                <label className="block text-[10px] text-gray-500 mb-0.5">Direction</label>
                <select
                  value={arg.direction}
                  onChange={(e) =>
                    updateArgument(arg.id, {
                      direction: e.target.value as WorkflowArgument["direction"],
                    })
                  }
                  className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
                >
                  {directionOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Default value for "in" args */}
            {(arg.direction === "in" || arg.direction === "in_out") && (
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Valeur par defaut</label>
                <input
                  value={String(arg.defaultValue ?? "")}
                  onChange={(e) => {
                    let val: unknown = e.target.value;
                    if (arg.type === "number") val = parseFloat(e.target.value) || 0;
                    if (arg.type === "boolean") val = e.target.value === "true";
                    updateArgument(arg.id, { defaultValue: val });
                  }}
                  className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
                  placeholder={arg.type === "boolean" ? "true / false" : ""}
                />
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={() => removeArgument(arg.id)}
              className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              Supprimer
            </button>
          </div>
        ))}

        <button
          onClick={addArgument}
          className="w-full px-3 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 transition-colors"
        >
          + Ajouter un argument
        </button>
      </div>
    </aside>
  );
}

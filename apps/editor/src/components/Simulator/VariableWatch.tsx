import { useSimulationStore } from "../../stores/simulation-store";

export default function VariableWatch() {
  const variables = useSimulationStore((s) => s.variables);
  const simStatus = useSimulationStore((s) => s.simulationStatus);
  const loopCount = useSimulationStore((s) => s.loopCount);
  const simulatedTimeMs = useSimulationStore((s) => s.simulatedTimeMs);

  const entries = Object.entries(variables);

  if (simStatus === "idle") {
    return (
      <div className="px-3 py-4 text-center text-xs text-gray-600">
        Lancez la simulation pour voir les variables.
      </div>
    );
  }

  return (
    <div className="px-3 py-2 space-y-2">
      {/* Stats */}
      <div className="flex items-center gap-3 text-[10px] text-gray-500 pb-2 border-b border-gray-800">
        <span>Boucle : <span className="text-gray-300">{loopCount}</span></span>
        <span>Temps : <span className="text-gray-300">{(simulatedTimeMs / 1000).toFixed(1)}s</span></span>
      </div>

      {/* Variables */}
      {entries.length === 0 ? (
        <p className="text-xs text-gray-600 py-2">Aucune variable définie.</p>
      ) : (
        <div className="space-y-1">
          {entries.map(([name, value]) => {
            const strVal = formatValue(value);
            const typeColor = getTypeColor(value);

            return (
              <div
                key={name}
                className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeColor}`} />
                  <span className="text-xs text-gray-400 font-mono truncate">{name}</span>
                </div>
                <span className="text-xs text-gray-200 font-mono ml-2 shrink-0 max-w-[100px] truncate" title={strVal}>
                  {strVal}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return `"${value}"`;
  return JSON.stringify(value);
}

function getTypeColor(value: unknown): string {
  if (typeof value === "number") return "bg-blue-400";
  if (typeof value === "boolean") return "bg-green-400";
  if (typeof value === "string") return "bg-orange-400";
  return "bg-gray-400";
}

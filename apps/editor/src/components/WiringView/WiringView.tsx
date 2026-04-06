import { useMemo } from "react";
import { useWorkflowStore } from "../../stores/workflow-store";
import { useWiringStore } from "../../stores/wiring-store";
import { aggregateWiring } from "../../services/wiring-aggregator";

const COLOR_BORDER: Record<string, string> = {
  red: "border-red-500",
  black: "border-gray-500",
  green: "border-green-500",
  blue: "border-blue-500",
  yellow: "border-yellow-400",
  brown: "border-amber-700",
  orange: "border-orange-500",
  white: "border-gray-200",
  purple: "border-purple-500",
};

const COLOR_BG: Record<string, string> = {
  red: "bg-red-500",
  black: "bg-gray-600",
  green: "bg-green-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-400",
  brown: "bg-amber-700",
  orange: "bg-orange-500",
  white: "bg-gray-200",
  purple: "bg-purple-500",
};

export default function WiringView() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const boardId = useWorkflowStore((s) => s.boardId);
  const { checkedConnections, toggleConnection, resetChecklist } = useWiringStore();

  const connections = useMemo(() => aggregateWiring(nodes, boardId), [nodes, boardId]);

  const checkedCount = connections.filter((c) => checkedConnections.has(c.id)).length;
  const total = connections.length;
  const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  return (
    <div className="w-80 flex flex-col border-l border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🔌</span>
          <span className="text-sm font-semibold text-gray-200">Guide de câblage</span>
        </div>
        {total > 0 && (
          <button
            onClick={resetChecklist}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Progression</span>
            <span className={`text-xs font-medium ${progress === 100 ? "text-green-400" : "text-gray-300"}`}>
              {checkedCount}/{total} ({progress}%)
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress === 100 ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
              <span>✓</span> Câblage complet — prêt à flasher !
            </p>
          )}
        </div>
      )}

      {/* Connection list */}
      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
            <span className="text-3xl opacity-30">🔌</span>
            <p className="text-sm text-gray-500">
              Ajoutez des blocs avec des composants pour voir le guide de câblage.
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {connections.map((conn) => {
              const checked = checkedConnections.has(conn.id);
              const borderCls = COLOR_BORDER[conn.color] ?? "border-gray-500";
              const bgCls = COLOR_BG[conn.color] ?? "bg-gray-500";

              return (
                <button
                  key={conn.id}
                  onClick={() => toggleConnection(conn.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    checked
                      ? "border-green-800 bg-green-950/30 opacity-60"
                      : `border-gray-800 bg-gray-900 hover:border-gray-700`
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      checked ? "bg-green-600 border-green-600" : "border-gray-600 bg-gray-800"
                    }`}
                  >
                    {checked && <span className="text-white text-[10px]">✓</span>}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Wire color indicator */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-5 h-1.5 rounded-full ${bgCls}`} />
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {conn.label}
                      </span>
                    </div>

                    {/* From → To */}
                    <div className={`flex items-center gap-1.5 text-xs ${checked ? "line-through text-gray-500" : "text-gray-200"}`}>
                      <span className={`font-mono px-1.5 py-0.5 rounded border text-[11px] ${borderCls} bg-gray-950`}>
                        {conn.from}
                      </span>
                      <span className="text-gray-600">→</span>
                      <span className={`font-mono px-1.5 py-0.5 rounded border text-[11px] ${borderCls} bg-gray-950`}>
                        {conn.to}
                      </span>
                    </div>

                    {/* Block source */}
                    <p className="mt-1 text-[10px] text-gray-600">
                      {conn.blockIcon} {conn.blockLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      {connections.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-800 shrink-0">
          <p className="text-[10px] text-gray-600">
            Cochez chaque connexion au fur et à mesure du câblage.
          </p>
        </div>
      )}
    </div>
  );
}

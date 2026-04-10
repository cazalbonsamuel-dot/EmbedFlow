import { useMemo, useState } from "react";
import { useWorkflowStore } from "../../stores/workflow-store";
import { useWiringStore } from "../../stores/wiring-store";
import { aggregateWiring, groupWiring } from "../../services/wiring-aggregator";

// Wire color → CSS
const WIRE_BG: Record<string, string> = {
  red: "bg-red-500",
  black: "bg-gray-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-400",
  brown: "bg-amber-700",
  orange: "bg-orange-500",
  white: "bg-gray-200",
  purple: "bg-purple-500",
};

const WIRE_BORDER: Record<string, string> = {
  red: "border-red-500",
  black: "border-gray-500",
  green: "border-green-500",
  blue: "border-blue-500",
  yellow: "border-yellow-400",
  brown: "border-amber-700",
  orange: "border-orange-500",
  white: "border-gray-300",
  purple: "border-purple-500",
};

const WIRE_TEXT: Record<string, string> = {
  red: "text-red-400",
  black: "text-gray-400",
  green: "text-green-400",
  blue: "text-blue-400",
  yellow: "text-yellow-400",
  brown: "text-amber-600",
  orange: "text-orange-400",
  white: "text-gray-300",
  purple: "text-purple-400",
};

// Wire type label → icon
const WIRE_ICON: Record<string, string> = {
  ALIMENTATION: "⚡",
  MASSE: "⏚",
  DONNÉES: "⇄",
  SIGNAL: "〜",
  TRIGGER: "↑",
  ECHO: "↩",
  PWM: "∿",
  SDA: "⇄",
  SCL: "⌚",
  TX: "→",
  RX: "←",
};

function getWireIcon(label: string): string {
  const upper = label.toUpperCase();
  for (const [key, icon] of Object.entries(WIRE_ICON)) {
    if (upper.includes(key)) return icon;
  }
  return "—";
}

export default function WiringView() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const boardId = useWorkflowStore((s) => s.boardId);
  const { checkedConnections, toggleConnection, resetChecklist } = useWiringStore();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const connections = useMemo(() => aggregateWiring(nodes, boardId), [nodes, boardId]);
  const groups = useMemo(() => groupWiring(connections), [connections]);

  const total = connections.length;
  const checkedCount = connections.filter((c) => checkedConnections.has(c.id)).length;
  const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  const toggleCollapse = (nodeId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const checkAll = (nodeId: string) => {
    const group = groups.find((g) => g.nodeId === nodeId);
    if (!group) return;
    const allChecked = group.connections.every((c) => checkedConnections.has(c.id));
    for (const conn of group.connections) {
      const isChecked = checkedConnections.has(conn.id);
      if (allChecked ? isChecked : !isChecked) toggleConnection(conn.id);
    }
  };

  return (
    <div className="w-80 flex flex-col border-l border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center justify-between mb-0.5">
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
        {total > 0 && (
          <p className="text-[11px] text-gray-500">
            {groups.length} composant{groups.length > 1 ? "s" : ""} · {total} connexion{total > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="px-4 py-2.5 border-b border-gray-800 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Progression</span>
            <span className={`text-xs font-semibold tabular-nums ${progress === 100 ? "text-green-400" : "text-gray-300"}`}>
              {checkedCount}/{total} · {progress}%
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress === 100 ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <p className="mt-1.5 text-xs text-green-400 font-medium flex items-center gap-1.5">
              <span>✓</span> Câblage complet — prêt à flasher !
            </p>
          )}
        </div>
      )}

      {/* Groups */}
      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
            <span className="text-4xl opacity-20">🔌</span>
            <p className="text-sm text-gray-500">
              Ajoutez des blocs pour voir le guide de câblage.
            </p>
          </div>
        ) : (
          <div className="py-2">
            {groups.map((group) => {
              const groupChecked = group.connections.filter((c) => checkedConnections.has(c.id)).length;
              const groupTotal = group.connections.length;
              const allChecked = groupChecked === groupTotal;
              const isCollapsed = collapsed.has(group.nodeId);

              return (
                <div key={group.nodeId} className="mb-1">
                  {/* Group header */}
                  <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800/40 transition-colors">
                    <button
                      onClick={() => toggleCollapse(group.nodeId)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      <span className="text-sm shrink-0">{group.blockIcon}</span>
                      <span className="text-xs font-semibold text-gray-200 truncate">{group.blockLabel}</span>
                      <span className={`ml-auto shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        allChecked
                          ? "bg-green-900/60 text-green-400"
                          : "bg-gray-800 text-gray-400"
                      }`}>
                        {groupChecked}/{groupTotal}
                      </span>
                      <span className="text-gray-600 text-xs shrink-0">
                        {isCollapsed ? "▶" : "▼"}
                      </span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); checkAll(group.nodeId); }}
                      className={`text-[10px] px-2 py-1 rounded border transition-colors shrink-0 ${
                        allChecked
                          ? "border-green-800 text-green-500 hover:bg-green-900/30"
                          : "border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200"
                      }`}
                    >
                      {allChecked ? "Tout décocher" : "Tout cocher"}
                    </button>
                  </div>

                  {/* Connections */}
                  {!isCollapsed && (
                    <div className="mx-3 mb-2 space-y-1.5">
                      {group.connections.map((conn) => {
                        const checked = checkedConnections.has(conn.id);
                        const bgCls = WIRE_BG[conn.color] ?? "bg-gray-500";
                        const borderCls = WIRE_BORDER[conn.color] ?? "border-gray-500";
                        const textCls = WIRE_TEXT[conn.color] ?? "text-gray-400";
                        const icon = getWireIcon(conn.label);

                        return (
                          <button
                            key={conn.id}
                            onClick={() => toggleConnection(conn.id)}
                            className={`w-full text-left flex items-stretch rounded-lg border overflow-hidden transition-all ${
                              checked
                                ? "border-green-900 bg-green-950/20 opacity-50"
                                : `${borderCls} bg-gray-900 hover:bg-gray-800/70`
                            }`}
                          >
                            {/* Color strip */}
                            <div className={`w-1.5 shrink-0 ${checked ? "bg-green-700" : bgCls}`} />

                            {/* Content */}
                            <div className="flex-1 px-3 py-2.5 min-w-0">
                              {/* Wire type badge */}
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className={`text-[11px] font-mono ${checked ? "text-gray-500" : textCls}`}>
                                  {icon}
                                </span>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${checked ? "text-gray-500" : textCls}`}>
                                  {conn.label}
                                </span>
                                <div className={`ml-auto w-2 h-2 rounded-full shrink-0 ${checked ? "bg-green-600" : bgCls}`} />
                              </div>

                              {/* FROM → TO */}
                              <div className={`flex items-center gap-2 ${checked ? "opacity-50" : ""}`}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] text-gray-600 uppercase mb-0.5">De</p>
                                  <p className={`font-mono text-xs font-medium truncate ${checked ? "line-through text-gray-500" : "text-gray-100"}`}>
                                    {conn.from}
                                  </p>
                                </div>
                                <span className="text-gray-600 text-sm shrink-0">→</span>
                                <div className="flex-1 min-w-0 text-right">
                                  <p className="text-[9px] text-gray-600 uppercase mb-0.5">Vers</p>
                                  <p className={`font-mono text-xs font-medium truncate ${checked ? "line-through text-gray-500" : "text-gray-100"}`}>
                                    {conn.to}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Checkbox */}
                            <div className="flex items-center px-2.5 shrink-0">
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                                checked
                                  ? "bg-green-600 border-green-600"
                                  : "border-gray-600 bg-gray-800"
                              }`}>
                                {checked && <span className="text-white text-xs font-bold">✓</span>}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {connections.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-800 shrink-0">
          <p className="text-[10px] text-gray-600 text-center">
            Cochez chaque fil au fur et à mesure du câblage.
          </p>
        </div>
      )}
    </div>
  );
}

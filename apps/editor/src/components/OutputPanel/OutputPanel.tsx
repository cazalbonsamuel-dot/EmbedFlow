import { useState } from "react";
import { useWorkflowStore } from "../../stores/workflow-store";

export default function OutputPanel() {
  const validationMessages = useWorkflowStore((s) => s.validationMessages);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);
  const [collapsed, setCollapsed] = useState(false);

  const errors = validationMessages.filter((m) => m.level === "error");
  const warnings = validationMessages.filter((m) => m.level === "warning");

  const icons = { error: "❌", warning: "⚠️", info: "ℹ️" };
  const colors = {
    error: "text-red-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900/50">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-800/50"
      >
        <span>{collapsed ? "▶" : "▼"}</span>
        <span>Validation</span>
        {errors.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-400 text-[10px]">
            {errors.length}
          </span>
        )}
        {warnings.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-yellow-900/50 text-yellow-400 text-[10px]">
            {warnings.length}
          </span>
        )}
        {validationMessages.length === 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-green-900/50 text-green-400 text-[10px]">
            OK
          </span>
        )}
      </button>

      {/* Messages */}
      {!collapsed && validationMessages.length > 0 && (
        <div className="max-h-32 overflow-y-auto px-4 pb-2 space-y-1">
          {validationMessages.map((msg, i) => (
            <div
              key={i}
              onClick={() => msg.nodeId && setSelectedNode(msg.nodeId)}
              className={`flex items-start gap-2 text-xs py-1 ${
                msg.nodeId ? "cursor-pointer hover:bg-gray-800/50 rounded px-1 -mx-1" : ""
              }`}
            >
              <span className="shrink-0">{icons[msg.level]}</span>
              <span className={colors[msg.level]}>{msg.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

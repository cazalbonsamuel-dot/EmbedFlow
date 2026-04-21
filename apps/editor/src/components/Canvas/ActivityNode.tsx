import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import { getActivity } from "@embedflow/activity-registry";
import type { ActivityNodeData } from "../../stores/workflow-store";
import { useWorkflowStore } from "../../stores/workflow-store";
import { useSimulationStore } from "../../stores/simulation-store";
import { getEffectiveActivity } from "../../services/effective-activity";

const portTypeColors: Record<string, string> = {
  execution: "#46464F",
  number: "#4B7CF3",
  boolean: "#22C55E",
  string: "#F0A429",
};

function ActivityNode({ id, data, selected }: NodeProps<Node<ActivityNodeData>>) {
  const projectWorkflows = useWorkflowStore((s) => s.projectWorkflows);
  const allWorkflowData = useWorkflowStore((s) => s.allWorkflowData);
  const currentWorkflow = useWorkflowStore((s) => s.workflow);

  const getWorkflowArgs = (wfId: string) => {
    if (wfId === currentWorkflow.id) return currentWorkflow.arguments || [];
    return allWorkflowData[wfId]?.workflow.arguments || [];
  };

  const activity = data.activityId === "workflow.invoke"
    ? getEffectiveActivity(data.activityId, data.properties, projectWorkflows, getWorkflowArgs)
    : getActivity(data.activityId);

  const currentNodeId = useSimulationStore((s) => s.currentNodeId);
  const errorNodeId = useSimulationStore((s) => s.errorNodeId);
  const simStatus = useSimulationStore((s) => s.simulationStatus);
  const validationMessages = useWorkflowStore((s) => s.validationMessages);
  if (!activity) return null;

  const isSimActive = simStatus !== "idle";
  const isCurrent = isSimActive && currentNodeId === id;
  const isError = isSimActive && errorNodeId === id;

  const nodeErrors = validationMessages.filter((m) => m.nodeId === id && m.level === "error");
  const nodeWarnings = validationMessages.filter((m) => m.nodeId === id && m.level === "warning");
  const hasErrors = nodeErrors.length > 0;
  const hasWarnings = nodeWarnings.length > 0;

  // Determine outline state
  let outlineColor = "transparent";
  let outlineStyle = "none";
  if (isError) {
    outlineColor = "var(--error)";
    outlineStyle = "2px solid var(--error)";
  } else if (isCurrent) {
    outlineColor = "var(--accent)";
    outlineStyle = "2px solid var(--accent)";
  } else if (selected) {
    outlineStyle = "2px solid var(--accent)";
  } else if (hasErrors) {
    outlineStyle = "1px solid var(--error)";
  } else if (hasWarnings) {
    outlineStyle = "1px solid var(--warning)";
  }

  return (
    <div
      className="relative"
      style={{
        minWidth: "180px",
        borderRadius: "6px",
        background: "var(--color-raised)",
        border: "1px solid var(--border-default)",
        outline: outlineStyle,
        outlineOffset: "2px",
        animation: isCurrent ? "pulse 1s ease-in-out infinite" : "none",
      }}
    >
      {/* Validation badge */}
      {(hasErrors || hasWarnings) && (
        <div
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold z-10"
          style={{
            background: hasErrors ? "var(--error)" : "var(--warning)",
            color: hasErrors ? "#fff" : "#000",
          }}
          title={
            hasErrors
              ? nodeErrors.map((m) => m.message).join("\n")
              : nodeWarnings.map((m) => m.message).join("\n")
          }
        >
          {hasErrors ? nodeErrors.length : nodeWarnings.length}
        </div>
      )}

      {/* Color accent strip (left border) */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-[6px]"
        style={{ width: "3px", background: data.color }}
      />

      {/* Input handles */}
      {activity.inputs.map((input, i) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Top}
          id={input.id}
          style={{
            left: `${((i + 1) / (activity.inputs.length + 1)) * 100}%`,
            width: input.type === "execution" ? 10 : 8,
            height: input.type === "execution" ? 10 : 8,
            backgroundColor: portTypeColors[input.type] || "#46464F",
            borderRadius: input.type === "execution" ? 2 : "50%",
            border: "2px solid var(--color-raised)",
          }}
          title={input.name}
        />
      ))}

      {/* Header */}
      <div
        className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-t-[6px]"
        style={{ borderBottom: "1px solid var(--border-dim)" }}
      >
        <span className="text-sm leading-none shrink-0">{data.icon}</span>
        <span
          className="text-xs font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {data.label}
        </span>
      </div>

      {/* Body */}
      <div className="pl-4 pr-3 py-1.5 space-y-0.5">
        {activity.properties
          .filter((p) => p.level === "essential" && data.properties[p.name] !== undefined)
          .slice(0, 3)
          .map((prop) => (
            <div key={prop.name} className="flex justify-between gap-2 items-center">
              <span className="text-[10px] truncate shrink-0" style={{ color: "var(--text-tertiary)" }}>
                {prop.label}
              </span>
              <span
                className="text-[11px] truncate max-w-[90px] font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                {String(data.properties[prop.name])}
              </span>
            </div>
          ))}
        {activity.properties.filter((p) => p.level === "essential").length === 0 && (
          <div className="text-[10px] italic" style={{ color: "var(--text-tertiary)" }}>
            Aucun paramètre
          </div>
        )}
      </div>

      {/* Output handles */}
      {activity.outputs.map((output, i) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Bottom}
          id={output.id}
          style={{
            left: `${((i + 1) / (activity.outputs.length + 1)) * 100}%`,
            width: output.type === "execution" ? 10 : 8,
            height: output.type === "execution" ? 10 : 8,
            backgroundColor: portTypeColors[output.type] || "#46464F",
            borderRadius: output.type === "execution" ? 2 : "50%",
            border: "2px solid var(--color-raised)",
          }}
          title={output.name}
        />
      ))}
    </div>
  );
}

export default memo(ActivityNode);

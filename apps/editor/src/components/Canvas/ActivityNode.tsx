import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import { getActivity } from "@embedflow/activity-registry";
import type { ActivityNodeData } from "../../stores/workflow-store";
import { useWorkflowStore } from "../../stores/workflow-store";
import { useSimulationStore } from "../../stores/simulation-store";
import { getEffectiveActivity } from "../../services/effective-activity";

const portTypeColors: Record<string, string> = {
  execution: "#6b7280",
  number: "#3b82f6",
  boolean: "#22c55e",
  string: "#f97316",
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

  // Validation badges
  const nodeErrors = validationMessages.filter((m) => m.nodeId === id && m.level === "error");
  const nodeWarnings = validationMessages.filter((m) => m.nodeId === id && m.level === "warning");
  const hasErrors = nodeErrors.length > 0;
  const hasWarnings = nodeWarnings.length > 0;

  let borderClass = selected ? "border-blue-400 ring-2 ring-blue-400/30" : "border-gray-700";
  if (isError) {
    borderClass = "border-red-500 ring-2 ring-red-500/30";
  } else if (isCurrent) {
    borderClass = "border-blue-400 ring-2 ring-blue-400/30 animate-pulse";
  } else if (hasErrors && !selected) {
    borderClass = "border-red-500/60";
  } else if (hasWarnings && !selected) {
    borderClass = "border-yellow-500/50";
  }

  return (
    <div
      className={`rounded-lg shadow-lg bg-gray-800 border-2 min-w-[180px] relative ${borderClass}`}
    >
      {/* Validation badge */}
      {(hasErrors || hasWarnings) && (
        <div
          className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md z-10 ${
            hasErrors
              ? "bg-red-600 text-white"
              : "bg-yellow-500 text-yellow-950"
          }`}
          title={
            hasErrors
              ? nodeErrors.map((m) => m.message).join("\n")
              : nodeWarnings.map((m) => m.message).join("\n")
          }
        >
          {hasErrors ? nodeErrors.length : nodeWarnings.length}
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-md text-white text-sm font-medium"
        style={{ backgroundColor: data.color }}
      >
        <span className="text-base">{data.icon}</span>
        <span className="truncate">{data.label}</span>
      </div>

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
            backgroundColor: portTypeColors[input.type],
            borderRadius: input.type === "execution" ? 2 : "50%",
            border: "2px solid #1f2937",
          }}
          title={input.name}
        />
      ))}

      {/* Body — show configured properties summary */}
      <div className="px-3 py-2 text-xs text-gray-400 space-y-0.5">
        {activity.properties
          .filter((p) => p.level === "essential" && data.properties[p.name] !== undefined)
          .slice(0, 3)
          .map((prop) => (
            <div key={prop.name} className="flex justify-between gap-2">
              <span className="text-gray-500">{prop.label}</span>
              <span className="text-gray-300 truncate max-w-[100px]">
                {String(data.properties[prop.name])}
              </span>
            </div>
          ))}
        {activity.properties.filter((p) => p.level === "essential").length === 0 && (
          <div className="text-gray-600 italic">Aucun parametre</div>
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
            backgroundColor: portTypeColors[output.type],
            borderRadius: output.type === "execution" ? 2 : "50%",
            border: "2px solid #1f2937",
          }}
          title={output.name}
        />
      ))}
    </div>
  );
}

export default memo(ActivityNode);

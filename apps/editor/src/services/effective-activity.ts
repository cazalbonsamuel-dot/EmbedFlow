import type { ActivityDefinition, PortDef } from "@embedflow/activity-registry";
import { getActivity } from "@embedflow/activity-registry";
import type { WorkflowArgument } from "@embedflow/workflow-engine";
import type { SubWorkflowMeta } from "../stores/workflow-store";

interface WorkflowWithArgs {
  id: string;
  name: string;
  arguments: WorkflowArgument[];
}

/**
 * For workflow.invoke nodes, returns a modified ActivityDefinition
 * with dynamic ports matching the target sub-workflow's arguments.
 *
 * For all other activities, returns the standard definition.
 */
export function getEffectiveActivity(
  activityId: string,
  properties: Record<string, unknown>,
  projectWorkflows: SubWorkflowMeta[],
  getWorkflowArgs?: (id: string) => WorkflowArgument[],
): ActivityDefinition | undefined {
  const base = getActivity(activityId);
  if (!base) return undefined;

  if (activityId !== "workflow.invoke") return base;

  const targetId = properties.targetWorkflowId as string | undefined;
  if (!targetId || !getWorkflowArgs) return base;

  const targetMeta = projectWorkflows.find((w) => w.id === targetId);
  if (!targetMeta) return base;

  const args = getWorkflowArgs(targetId);
  if (!args || args.length === 0) return base;

  // Build dynamic ports from arguments
  const dynamicInputs: PortDef[] = [
    { id: "exec_in", name: "Entree", type: "execution" },
  ];
  const dynamicOutputs: PortDef[] = [
    { id: "exec_out", name: "Sortie", type: "execution" },
  ];

  for (const arg of args) {
    const portType = arg.type === "boolean" ? "boolean" : arg.type === "string" ? "string" : "number";

    if (arg.direction === "in" || arg.direction === "in_out") {
      dynamicInputs.push({
        id: `arg_in_${arg.id}`,
        name: `${arg.name} (in)`,
        type: portType,
      });
    }

    if (arg.direction === "out" || arg.direction === "in_out") {
      dynamicOutputs.push({
        id: `arg_out_${arg.id}`,
        name: `${arg.name} (out)`,
        type: portType,
      });
    }
  }

  return {
    ...base,
    label: `Appeler: ${targetMeta.name}`,
    inputs: dynamicInputs,
    outputs: dynamicOutputs,
  };
}

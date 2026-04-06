import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getActivity } from "@embedflow/activity-registry";
import { useWorkflowStore } from "../../../stores/workflow-store";
import SensorSlider from "./SensorSlider";
import SensorToggle from "./SensorToggle";

export default function SensorControls() {
  const { t } = useTranslation();
  const nodes = useWorkflowStore((s) => s.nodes);

  const sensorNodes = useMemo(() => {
    return nodes
      .map((node) => {
        const activity = getActivity(node.data.activityId);
        if (!activity) return null;
        // Only show controls for sensors and some inputs
        const isSensor = activity.category === "Capteurs";
        if (!isSensor) return null;
        return { node, activity };
      })
      .filter(Boolean) as { node: (typeof nodes)[0]; activity: NonNullable<ReturnType<typeof getActivity>> }[];
  }, [nodes]);

  if (sensorNodes.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-xs text-gray-600">
        {t("simulator.noSensors")}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 space-y-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("simulator.sensors")}</p>
      {sensorNodes.map(({ node, activity }) => {
        const sim = activity.simulate;

        if (sim.controlType === "slider" && sim.range) {
          return (
            <SensorSlider
              key={node.id}
              nodeId={node.id}
              label={activity.label}
              icon={activity.icon}
              range={sim.range}
              unit={sim.unit || ""}
              defaultValue={sim.defaultValue as number}
            />
          );
        }

        if (sim.controlType === "toggle" || sim.controlType === "button") {
          return (
            <SensorToggle
              key={node.id}
              nodeId={node.id}
              label={activity.label}
              icon={activity.icon}
              controlType={sim.controlType}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

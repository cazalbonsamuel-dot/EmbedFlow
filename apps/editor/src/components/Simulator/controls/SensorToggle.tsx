import { useSimulationStore } from "../../../stores/simulation-store";

interface SensorToggleProps {
  nodeId: string;
  label: string;
  icon: string;
  controlType: "toggle" | "button";
}

export default function SensorToggle({ nodeId, label, icon, controlType }: SensorToggleProps) {
  const value = useSimulationStore((s) => s.sensorInputs[nodeId] as boolean | undefined) ?? false;
  const setSensorInput = useSimulationStore((s) => s.setSensorInput);

  if (controlType === "button") {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {icon} {label}
        </span>
        <button
          onMouseDown={() => setSensorInput(nodeId, true)}
          onMouseUp={() => setSensorInput(nodeId, false)}
          onMouseLeave={() => setSensorInput(nodeId, false)}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            value
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          {value ? "Appuye" : "Appuyer"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">
        {icon} {label}
      </span>
      <button
        onClick={() => setSensorInput(nodeId, !value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          value ? "bg-blue-500" : "bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            value ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

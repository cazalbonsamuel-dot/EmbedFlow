import { useSimulationStore } from "../../../stores/simulation-store";

interface SensorSliderProps {
  nodeId: string;
  label: string;
  icon: string;
  range: [number, number];
  unit: string;
  defaultValue: number;
}

export default function SensorSlider({ nodeId, label, icon, range, unit, defaultValue }: SensorSliderProps) {
  const value = useSimulationStore((s) => s.sensorInputs[nodeId] as number | undefined) ?? defaultValue;
  const setSensorInput = useSimulationStore((s) => s.setSensorInput);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {icon} {label}
        </span>
        <span className="text-xs text-blue-400 font-mono">
          {typeof value === "number" ? value.toFixed(1) : value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={range[0]}
        max={range[1]}
        step={(range[1] - range[0]) > 100 ? 1 : 0.1}
        value={value}
        onChange={(e) => setSensorInput(nodeId, Number(e.target.value))}
        className="w-full accent-blue-500 h-1.5"
      />
    </div>
  );
}

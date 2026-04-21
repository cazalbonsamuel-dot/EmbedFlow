import { useMemo } from "react";
import { getBoard } from "@embedflow/hardware-db";
import type { PinDefinition } from "@embedflow/hardware-db";
import { useWorkflowStore } from "../../stores/workflow-store";

const pinTypeColors: Record<string, string> = {
  digital: "#6b7280",
  analog: "#22c55e",
  pwm: "#f97316",
  i2c: "#3b82f6",
  spi: "#a855f7",
  uart: "#ef4444",
};

interface PinSelectorProps {
  value: number | undefined;
  onChange: (pin: number) => void;
  filterRule?: string;
}

export default function PinSelector({ value, onChange, filterRule }: PinSelectorProps) {
  const boardId = useWorkflowStore((s) => s.boardId);
  const nodes = useWorkflowStore((s) => s.nodes);

  const board = getBoard(boardId);
  if (!board) return <div className="text-xs text-gray-500">Carte non trouvee</div>;

  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const selectedNode = useWorkflowStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId));

  // Activities that can share a pin with each other (e.g. turn_on + turn_off control the same LED)
  const COMPATIBLE_PAIRS: Record<string, string[]> = {
    "gpio.turn_on": ["gpio.turn_off"],
    "gpio.turn_off": ["gpio.turn_on"],
  };

  // Collect all pins currently used by other nodes (excluding current node and compatible activity pairs)
  const usedPins = useMemo(() => {
    const map = new Map<number, string>();
    const currentActivityId = selectedNode?.data.activityId;
    const compatibleActivities = currentActivityId ? (COMPATIBLE_PAIRS[currentActivityId] ?? []) : [];

    for (const node of nodes) {
      if (node.id === selectedNodeId) continue;
      if (compatibleActivities.includes(node.data.activityId)) continue;
      const props = node.data.properties;
      const pinProps = ["pin", "pin_trigger", "pin_echo", "pin_vitesse", "pin_direction"];
      for (const propName of pinProps) {
        const pinVal = props[propName];
        if (typeof pinVal === "number") {
          map.set(pinVal, node.data.label);
        }
      }
    }
    return map;
  }, [nodes, selectedNodeId, selectedNode]);

  // Filter pins by type if validation rule provided
  const isCompatible = (pin: PinDefinition): boolean => {
    if (!filterRule) return true;
    if (filterRule === "pin.digital") return pin.types.includes("digital");
    if (filterRule === "pin.analog") return pin.types.includes("analog");
    if (filterRule === "pin.pwm") return pin.types.includes("pwm");
    return true;
  };

  // Determine pin primary color
  const getPinColor = (pin: PinDefinition): string => {
    if (pin.types.includes("pwm")) return pinTypeColors.pwm;
    if (pin.types.includes("analog")) return pinTypeColors.analog;
    if (pin.types.includes("i2c")) return pinTypeColors.i2c;
    if (pin.types.includes("spi")) return pinTypeColors.spi;
    if (pin.types.includes("uart")) return pinTypeColors.uart;
    return pinTypeColors.digital;
  };

  // Layout: 2 columns representing board sides
  const leftPins = board.pins.filter((p) => p.position.x === 0);
  const rightPins = board.pins.filter((p) => p.position.x === 1);

  const renderPin = (pin: PinDefinition) => {
    const compatible = isCompatible(pin);
    const used = usedPins.get(pin.number);
    const isSelected = value === pin.number;
    const isUsedByOther = used && !isSelected;

    return (
      <button
        key={pin.number}
        onClick={() => compatible && !isUsedByOther && onChange(pin.number)}
        disabled={!compatible || !!isUsedByOther}
        title={
          isUsedByOther
            ? `Utilise par : ${used}`
            : !compatible
              ? "Pin incompatible"
              : `${pin.name} — ${pin.types.join(", ")}`
        }
        className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-all w-full ${
          isSelected
            ? "bg-blue-600/30 border border-blue-500 text-blue-300"
            : isUsedByOther
              ? "opacity-30 cursor-not-allowed bg-gray-800/30"
              : !compatible
                ? "opacity-20 cursor-not-allowed"
                : "hover:bg-gray-700/50 cursor-pointer"
        }`}
      >
        <span
          className="w-3 h-3 rounded-full shrink-0 border border-gray-600"
          style={{ backgroundColor: compatible ? getPinColor(pin) : "#374151" }}
        />
        <span className={`truncate ${isSelected ? "text-blue-300 font-medium" : "text-gray-400"}`}>
          {pin.name}
        </span>
        {isUsedByOther && (
          <span className="text-[9px] text-red-400 ml-auto shrink-0">occupe</span>
        )}
        {isSelected && (
          <span className="text-[9px] text-blue-400 ml-auto shrink-0">&#10003;</span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      {/* Board name */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{board.name}</span>
        <span className="text-[10px] text-gray-600">{board.voltage}V</span>
      </div>

      {/* Pin layout */}
      <div className="flex gap-2">
        {/* Left column */}
        <div className="flex-1 space-y-0.5">
          {leftPins.map(renderPin)}
        </div>
        {/* Right column */}
        <div className="flex-1 space-y-0.5">
          {rightPins.map(renderPin)}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-800">
        {Object.entries(pinTypeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-gray-500 uppercase">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

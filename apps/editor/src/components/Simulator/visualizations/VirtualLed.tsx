interface VirtualLedProps {
  pin: number;
  on: boolean;
  intensity: number;
  color?: string;
  label?: string;
}

export default function VirtualLed({ pin, on, intensity, color, label }: VirtualLedProps) {
  const ledColor = color || "#ef4444";
  const opacity = on ? intensity / 255 : 0.15;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-6 h-6 rounded-full border border-gray-600 transition-all duration-200"
        style={{
          backgroundColor: on ? ledColor : "#374151",
          opacity,
          boxShadow: on ? `0 0 8px 2px ${ledColor}` : "none",
        }}
      />
      <span className="text-[9px] text-gray-500">{label || `Pin ${pin}`}</span>
    </div>
  );
}

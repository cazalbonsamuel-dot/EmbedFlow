interface VirtualBuzzerProps {
  pin: number;
  frequency: number;
  active: boolean;
}

export default function VirtualBuzzer({ pin, frequency, active }: VirtualBuzzerProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg transition-all ${
          active
            ? "border-amber-400 bg-amber-900/30 animate-pulse"
            : "border-gray-600 bg-gray-800"
        }`}
      >
        {active ? "🔊" : "🔇"}
      </div>
      <span className="text-[9px] text-gray-500">
        Pin {pin}{active ? ` — ${frequency} Hz` : ""}
      </span>
    </div>
  );
}

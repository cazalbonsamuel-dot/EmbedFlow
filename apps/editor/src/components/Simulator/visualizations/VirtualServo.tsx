interface VirtualServoProps {
  pin: number;
  angle: number;
}

export default function VirtualServo({ pin, angle }: VirtualServoProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="64" height="40" viewBox="0 0 64 40">
        {/* Semicircle arc */}
        <path
          d="M 4 36 A 28 28 0 0 1 60 36"
          fill="none"
          stroke="#4b5563"
          strokeWidth="2"
        />
        {/* Degree markers */}
        {[0, 30, 60, 90, 120, 150, 180].map((deg) => {
          const rad = (Math.PI * deg) / 180;
          const x = 32 - 26 * Math.cos(rad);
          const y = 36 - 26 * Math.sin(rad);
          return (
            <circle key={deg} cx={x} cy={y} r="1.5" fill="#6b7280" />
          );
        })}
        {/* Needle */}
        <line
          x1="32"
          y1="36"
          x2={32 - 24 * Math.cos((Math.PI * angle) / 180)}
          y2={36 - 24 * Math.sin((Math.PI * angle) / 180)}
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: "all 0.3s ease-out" }}
        />
        {/* Center dot */}
        <circle cx="32" cy="36" r="3" fill="#3b82f6" />
      </svg>
      <span className="text-[9px] text-gray-500">Servo Pin {pin}: {angle}°</span>
    </div>
  );
}

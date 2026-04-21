interface VirtualLcdProps {
  lines: [string, string];
  backlight: boolean;
}

export default function VirtualLcd({ lines, backlight }: VirtualLcdProps) {
  const pad = (text: string) => text.padEnd(16, " ").slice(0, 16);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="rounded border border-gray-600 p-2 font-mono text-xs leading-5"
        style={{
          backgroundColor: backlight ? "#1a3a1a" : "#0d1f0d",
          color: backlight ? "#33ff33" : "#1a4a1a",
          textShadow: backlight ? "0 0 4px #33ff33" : "none",
          minWidth: "160px",
        }}
      >
        <div className="whitespace-pre">{pad(lines[0])}</div>
        <div className="whitespace-pre">{pad(lines[1])}</div>
      </div>
      <span className="text-[9px] text-gray-500">LCD 16x2</span>
    </div>
  );
}

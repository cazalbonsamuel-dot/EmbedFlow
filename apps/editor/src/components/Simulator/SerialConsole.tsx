import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSimulationStore } from "../../stores/simulation-store";

export default function SerialConsole() {
  const { t } = useTranslation();
  const serialOutput = useSimulationStore((s) => s.serialOutput);
  const clearSerial = useSimulationStore((s) => s.clearSerial);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [serialOutput.length]);

  return (
    <div className="flex flex-col border-t border-gray-800" style={{ height: 150 }}>
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-800">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t("simulator.serial")}</span>
        <button
          onClick={clearSerial}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {t("simulator.clearSerial")}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-gray-950 p-2 font-mono text-xs text-green-400">
        {serialOutput.length === 0 ? (
          <span className="text-gray-700 italic">Console serie vide</span>
        ) : (
          serialOutput.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line.text}</div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

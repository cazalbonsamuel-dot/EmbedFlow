import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { generateCode } from "@embedflow/codegen";
import type { TargetPlatform } from "@embedflow/codegen";
import { getBoard } from "@embedflow/hardware-db";
import { useWorkflowStore } from "../../stores/workflow-store";

// Simple syntax highlighter for C/C++ Arduino code
function highlightCode(code: string): string {
  return code
    // Comments
    .replace(/(\/\/.*)/g, '<span class="text-gray-500">$1</span>')
    // Preprocessor directives
    .replace(/(#\w+)/g, '<span class="text-purple-400">$1</span>')
    // Strings
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="text-amber-300">$1</span>')
    // Keywords
    .replace(
      /\b(void|int|float|bool|char|long|unsigned|const|if|else|for|while|switch|case|break|default|return|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP)\b/g,
      '<span class="text-blue-400">$1</span>',
    )
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-cyan-300">$1</span>')
    // Arduino functions
    .replace(
      /\b(pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|delayMicroseconds|millis|tone|noTone|map|constrain|Serial|WiFi|Wire|pulseIn)\b/g,
      '<span class="text-green-400">$1</span>',
    );
}

export default function CodePanel() {
  const { t } = useTranslation();
  const workflow = useWorkflowStore((s) => s.workflow);
  const boardId = useWorkflowStore((s) => s.boardId);
  const [copied, setCopied] = useState(false);

  const board = getBoard(boardId);

  const result = useMemo(() => {
    return generateCode(workflow, {
      target: boardId as TargetPlatform,
      comments: true,
      language: "fr",
    });
  }, [workflow, boardId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ramPercent = board ? Math.round((result.estimatedRam / board.ram) * 100) : 0;
  const flashPercent = board ? Math.round((result.estimatedFlash / board.flash) * 100) : 0;

  return (
    <aside className="w-96 border-l border-gray-800 bg-gray-900/30 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">{t("actions.viewCode")}</h2>
          <p className="text-xs text-gray-500">{board?.name || boardId}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            copied
              ? "bg-green-900/50 text-green-400 border border-green-800"
              : "bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700"
          }`}
        >
          {copied ? "Copie !" : "Copier"}
        </button>
      </div>

      {/* Memory estimation */}
      <div className="px-4 py-2 border-b border-gray-800 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">RAM</span>
          <span className={`${ramPercent > 80 ? "text-red-400" : ramPercent > 50 ? "text-yellow-400" : "text-green-400"}`}>
            {result.estimatedRam} / {board?.ram || "?"} octets ({ramPercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              ramPercent > 80 ? "bg-red-500" : ramPercent > 50 ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(ramPercent, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Flash</span>
          <span className={`${flashPercent > 80 ? "text-red-400" : flashPercent > 50 ? "text-yellow-400" : "text-green-400"}`}>
            {result.estimatedFlash} / {board?.flash || "?"} octets ({flashPercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              flashPercent > 80 ? "bg-red-500" : flashPercent > 50 ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(flashPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Libraries */}
      {result.libraries.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Bibliotheques :</p>
          <div className="flex flex-wrap gap-1">
            {result.libraries.map((lib) => (
              <span key={lib.name} className="px-2 py-0.5 text-[10px] bg-blue-900/30 text-blue-400 rounded-full border border-blue-900/50">
                {lib.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-xs font-mono leading-5 text-gray-300">
          <code dangerouslySetInnerHTML={{ __html: highlightCode(result.code) }} />
        </pre>
      </div>
    </aside>
  );
}

import { useState } from "react";
import { useWorkflowStore } from "../../stores/workflow-store";
import { useCompileStore } from "../../stores/compile-store";
import { useSerialStore } from "../../stores/serial-store";
import SerialMonitor from "../SerialMonitor/SerialMonitor";

type Tab = "validation" | "compilation" | "serial";

export default function OutputPanel() {
  const validationMessages = useWorkflowStore((s) => s.validationMessages);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  const compileStatus = useCompileStore((s) => s.status);
  const compileErrors = useCompileStore((s) => s.errors);
  const compileWarnings = useCompileStore((s) => s.warnings);
  const rawOutput = useCompileStore((s) => s.rawOutput);
  const binarySize = useCompileStore((s) => s.binarySize);
  const duration = useCompileStore((s) => s.duration);
  const generatedCode = useCompileStore((s) => s.generatedCode);
  const toolchainMissing = useCompileStore((s) => s.toolchainMissing);
  const installStatus = useCompileStore((s) => s.installStatus);
  const installProgress = useCompileStore((s) => s.installProgress);
  const install = useCompileStore((s) => s.install);

  const serialStatus = useSerialStore((s) => s.status);

  const [activeTab, setActiveTab] = useState<Tab>("validation");
  const [collapsed, setCollapsed] = useState(false);

  const validErrors = validationMessages.filter((m) => m.level === "error");
  const validWarnings = validationMessages.filter((m) => m.level === "warning");

  const icons = { error: "❌", warning: "⚠️", info: "ℹ️" } as const;
  const colors = { error: "text-red-400", warning: "text-yellow-400", info: "text-blue-400" } as const;

  const serialDot =
    serialStatus === "connected"
      ? "bg-green-500"
      : serialStatus === "connecting"
        ? "bg-yellow-500"
        : serialStatus === "error"
          ? "bg-red-500"
          : "bg-gray-600";

  return (
    <div className={`border-t border-gray-800 bg-gray-900/50 flex flex-col ${collapsed ? "" : "h-48"}`}>
      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-800 shrink-0">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300"
        >
          {collapsed ? "▶" : "▼"}
        </button>

        {/* Tabs */}
        {(
          [
            { id: "validation", label: "Validation", badge: validErrors.length + validWarnings.length, badgeOk: validationMessages.length === 0 },
            { id: "compilation", label: "Compilation", badge: compileErrors.length + compileWarnings.length, badgeOk: compileStatus === "success" },
            { id: "serial", label: "Série", badge: 0, serialDot: true },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as Tab);
              if (collapsed) setCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id && !collapsed
                ? "border-blue-500 text-gray-200"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}

            {/* Validation/compilation badge */}
            {"badgeOk" in tab && tab.badgeOk && (
              <span className="px-1.5 py-0.5 rounded-full bg-green-900/50 text-green-400 text-[10px]">✓</span>
            )}
            {"badge" in tab && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-400 text-[10px]">
                {tab.badge}
              </span>
            )}

            {/* Serial status dot */}
            {"serialDot" in tab && tab.serialDot && (
              <span className={`w-1.5 h-1.5 rounded-full ${serialDot}`} />
            )}

            {/* Compile spinner */}
            {tab.id === "compilation" && compileStatus === "compiling" && (
              <span className="animate-spin text-[10px]">⏳</span>
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Validation tab */}
          {activeTab === "validation" && (
            <div className="h-full overflow-y-auto px-4 py-2 space-y-1">
              {validationMessages.length === 0 ? (
                <p className="text-xs text-green-400 py-2">✓ Aucune erreur — le workflow est valide.</p>
              ) : (
                validationMessages.map((msg, i) => (
                  <div
                    key={i}
                    onClick={() => msg.nodeId && setSelectedNode(msg.nodeId)}
                    className={`flex items-start gap-2 text-xs py-1 ${
                      msg.nodeId ? "cursor-pointer hover:bg-gray-800/50 rounded px-1 -mx-1" : ""
                    }`}
                  >
                    <span className="shrink-0">{icons[msg.level]}</span>
                    <span className={colors[msg.level]}>{msg.message}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Compilation tab */}
          {activeTab === "compilation" && (
            <div className="h-full overflow-y-auto px-4 py-2 space-y-2">
              {/* Toolchain install wizard */}
              {(toolchainMissing || installStatus === "installing" || installStatus === "success") && (
                <div className="rounded-lg border border-yellow-800/60 bg-yellow-950/20 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-yellow-300 font-medium">
                    <span>🔧</span>
                    <span>arduino-cli requis pour compiler</span>
                  </div>

                  {installStatus === "idle" && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-gray-400">
                        L'outil de compilation Arduino n'est pas installé. EmbedFlow peut l'installer automatiquement.
                      </p>
                      <button
                        onClick={install}
                        className="px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                      >
                        ⬇ Installer arduino-cli automatiquement
                      </button>
                    </div>
                  )}

                  {installStatus === "installing" && installProgress && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-gray-300">{installProgress.message}</p>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${installProgress.percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 tabular-nums">{installProgress.percent}%</p>
                    </div>
                  )}

                  {installStatus === "success" && (
                    <p className="text-[11px] text-green-400 flex items-center gap-1.5">
                      <span>✅</span> Installation terminée — vous pouvez maintenant compiler !
                    </p>
                  )}

                  {installStatus === "error" && installProgress && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-red-400">{installProgress.message}</p>
                      <button
                        onClick={install}
                        className="px-3 py-1.5 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                      >
                        Réessayer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {compileStatus === "idle" && !toolchainMissing && (
                <p className="text-xs text-gray-500 py-2">
                  Cliquez sur "Compiler" pour compiler le code généré.
                </p>
              )}

              {compileStatus === "compiling" && (
                <div className="flex items-center gap-2 text-xs text-yellow-400 py-2">
                  <span className="animate-spin">⏳</span>
                  <span>Compilation en cours...</span>
                </div>
              )}

              {(compileStatus === "success" || compileStatus === "error") && (
                <>
                  <div className={`flex items-center gap-2 text-xs py-1 ${
                    compileStatus === "success" ? "text-green-400" : "text-red-400"
                  }`}>
                    <span>{compileStatus === "success" ? "✅" : "❌"}</span>
                    <span>
                      {compileStatus === "success"
                        ? `Compilation réussie en ${duration}ms${binarySize ? ` — ${(binarySize / 1024).toFixed(1)} Ko` : ""}`
                        : `Échec de la compilation`}
                    </span>
                  </div>

                  {compileErrors.map((err, i) => (
                    <div key={i} className="flex flex-col gap-1 text-xs">
                      <div className="flex items-start gap-2">
                        {err.line > 0 && <span className="text-red-400 shrink-0">Ligne {err.line}:</span>}
                        <span className="text-red-300 whitespace-pre-wrap">{err.message}</span>
                        {err.blockLabel && (
                          <span className="text-gray-600 shrink-0">({err.blockLabel})</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {compileWarnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-yellow-400 shrink-0">⚠ Ligne {w.line}:</span>
                      <span className="text-yellow-300">{w.message}</span>
                    </div>
                  ))}

                  {rawOutput && compileStatus === "error" && (
                    <pre className="mt-1 text-[10px] text-gray-600 font-mono whitespace-pre-wrap break-all bg-gray-950 p-2 rounded">
                      {rawOutput.slice(0, 500)}
                    </pre>
                  )}

                  {generatedCode && compileStatus === "success" && (
                    <details className="mt-1">
                      <summary className="text-[10px] text-gray-600 cursor-pointer hover:text-gray-400">
                        Voir le code généré
                      </summary>
                      <pre className="mt-1 text-[10px] text-gray-400 font-mono whitespace-pre-wrap break-all bg-gray-950 p-2 rounded max-h-24 overflow-y-auto">
                        {generatedCode}
                      </pre>
                    </details>
                  )}
                </>
              )}
            </div>
          )}

          {/* Serial tab */}
          {activeTab === "serial" && <SerialMonitor />}
        </div>
      )}
    </div>
  );
}

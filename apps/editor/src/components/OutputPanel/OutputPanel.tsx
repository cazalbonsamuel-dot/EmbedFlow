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

  const serialDotColor =
    serialStatus === "connected"
      ? "var(--success)"
      : serialStatus === "connecting"
        ? "var(--warning)"
        : serialStatus === "error"
          ? "var(--error)"
          : "var(--text-tertiary)";

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        borderTop: "1px solid var(--border-dim)",
        background: "var(--color-raised)",
        height: collapsed ? "auto" : "176px",
      }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center shrink-0"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--border-dim)", height: "32px" }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-full flex items-center justify-center transition-colors duration-100"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
        >
          <span className="text-[8px]">{collapsed ? "▲" : "▼"}</span>
        </button>

        {/* Tabs */}
        {(
          [
            {
              id: "validation" as Tab,
              label: "Validation",
              badge: validErrors.length + validWarnings.length,
              ok: validationMessages.length === 0,
            },
            {
              id: "compilation" as Tab,
              label: "Compilation",
              badge: compileErrors.length + compileWarnings.length,
              ok: compileStatus === "success",
              spinning: compileStatus === "compiling",
            },
            {
              id: "serial" as Tab,
              label: "Série",
              dot: serialDotColor,
            },
          ]
        ).map((tab) => {
          const isActive = activeTab === tab.id && !collapsed;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (collapsed) setCollapsed(false);
              }}
              className="flex items-center gap-1.5 px-3 h-full text-xs font-medium transition-colors duration-100 relative"
              style={{ color: isActive ? "var(--text-primary)" : "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
              }}
            >
              {tab.label}

              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-px"
                  style={{ background: "var(--accent)" }}
                />
              )}

              {/* OK badge */}
              {"ok" in tab && tab.ok && (
                <span
                  className="text-[9px] px-1 rounded"
                  style={{ background: "var(--success-muted)", color: "var(--success)" }}
                >
                  ✓
                </span>
              )}

              {/* Error/warning count */}
              {"badge" in tab && (tab.badge ?? 0) > 0 && (
                <span
                  className="text-[9px] px-1 rounded font-mono"
                  style={{ background: "var(--error-muted)", color: "var(--error)" }}
                >
                  {tab.badge}
                </span>
              )}

              {/* Serial dot */}
              {"dot" in tab && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: tab.dot }}
                />
              )}

              {/* Compile spinner */}
              {"spinning" in tab && tab.spinning && (
                <span className="text-[9px] animate-spin" style={{ color: "var(--warning)" }}>⌛</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Validation */}
          {activeTab === "validation" && (
            <div className="h-full overflow-y-auto px-3 py-2 space-y-0.5">
              {validationMessages.length === 0 ? (
                <p className="text-xs py-1" style={{ color: "var(--success)" }}>
                  ✓ Aucune erreur — le workflow est valide.
                </p>
              ) : (
                validationMessages.map((msg, i) => (
                  <div
                    key={i}
                    onClick={() => msg.nodeId && setSelectedNode(msg.nodeId)}
                    className="flex items-start gap-2 text-xs py-1 rounded transition-colors duration-100"
                    style={{ cursor: msg.nodeId ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      if (msg.nodeId) (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "";
                    }}
                  >
                    <span className="shrink-0 mt-px">
                      {msg.level === "error" ? "✗" : msg.level === "warning" ? "!" : "i"}
                    </span>
                    <span style={{
                      color: msg.level === "error"
                        ? "var(--error)"
                        : msg.level === "warning"
                          ? "var(--warning)"
                          : "var(--text-secondary)",
                    }}>
                      {msg.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Compilation */}
          {activeTab === "compilation" && (
            <div className="h-full overflow-y-auto px-3 py-2 space-y-2">
              {/* Toolchain install wizard */}
              {(toolchainMissing || installStatus === "installing" || installStatus === "success") && (
                <div
                  className="rounded p-3 space-y-2"
                  style={{
                    background: "var(--warning-muted)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--warning)" }}>
                    <span>⚙</span>
                    <span>arduino-cli requis pour compiler</span>
                  </div>

                  {installStatus === "idle" && (
                    <div className="space-y-2">
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        L'outil de compilation Arduino n'est pas installé. EmbedFlow peut l'installer automatiquement.
                      </p>
                      <button
                        onClick={install}
                        className="px-3 py-1.5 text-xs rounded font-medium transition-colors duration-100 text-white"
                        style={{ background: "var(--accent)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}
                      >
                        ↓ Installer arduino-cli
                      </button>
                    </div>
                  )}

                  {installStatus === "installing" && installProgress && (
                    <div className="space-y-1.5">
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{installProgress.message}</p>
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ background: "var(--color-subtle)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${installProgress.percent}%`, background: "var(--accent)" }}
                        />
                      </div>
                      <p className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                        {installProgress.percent}%
                      </p>
                    </div>
                  )}

                  {installStatus === "success" && (
                    <p className="text-[11px]" style={{ color: "var(--success)" }}>
                      ✓ Installation terminée — vous pouvez maintenant compiler !
                    </p>
                  )}

                  {installStatus === "error" && installProgress && (
                    <div className="space-y-1.5">
                      <p className="text-[11px]" style={{ color: "var(--error)" }}>{installProgress.message}</p>
                      <button
                        onClick={install}
                        className="px-3 py-1.5 text-xs rounded transition-colors duration-100"
                        style={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--border-default)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Réessayer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {compileStatus === "idle" && !toolchainMissing && (
                <p className="text-xs py-1" style={{ color: "var(--text-tertiary)" }}>
                  Cliquez sur "Compiler" pour compiler le code généré.
                </p>
              )}

              {compileStatus === "compiling" && (
                <div className="flex items-center gap-2 text-xs py-1" style={{ color: "var(--warning)" }}>
                  <span className="animate-spin">⌛</span>
                  <span>Compilation en cours...</span>
                </div>
              )}

              {(compileStatus === "success" || compileStatus === "error") && (
                <>
                  <div
                    className="flex items-center gap-2 text-xs py-1"
                    style={{ color: compileStatus === "success" ? "var(--success)" : "var(--error)" }}
                  >
                    <span>{compileStatus === "success" ? "✓" : "✗"}</span>
                    <span>
                      {compileStatus === "success"
                        ? `Compilation réussie en ${duration}ms${binarySize ? ` — ${(binarySize / 1024).toFixed(1)} Ko` : ""}`
                        : "Échec de la compilation"}
                    </span>
                  </div>

                  {compileErrors.map((err, i) => (
                    <div key={i} className="flex flex-col gap-0.5 text-[11px]">
                      <div className="flex items-start gap-2">
                        {err.line > 0 && (
                          <span className="font-mono shrink-0" style={{ color: "var(--error)" }}>
                            L.{err.line}
                          </span>
                        )}
                        <span className="whitespace-pre-wrap" style={{ color: "var(--error)" }}>
                          {err.message}
                        </span>
                        {err.blockLabel && (
                          <span className="shrink-0" style={{ color: "var(--text-tertiary)" }}>
                            ({err.blockLabel})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {compileWarnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="font-mono shrink-0" style={{ color: "var(--warning)" }}>L.{w.line}</span>
                      <span style={{ color: "var(--warning)" }}>{w.message}</span>
                    </div>
                  ))}

                  {rawOutput && compileStatus === "error" && (
                    <pre
                      className="mt-1 text-[10px] font-mono whitespace-pre-wrap break-all p-2 rounded"
                      style={{
                        background: "var(--color-base)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {rawOutput.slice(0, 500)}
                    </pre>
                  )}

                  {generatedCode && compileStatus === "success" && (
                    <details className="mt-1">
                      <summary
                        className="text-[10px] cursor-pointer transition-colors duration-100"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
                      >
                        Voir le code généré
                      </summary>
                      <pre
                        className="mt-1 text-[10px] font-mono whitespace-pre-wrap break-all p-2 rounded max-h-24 overflow-y-auto"
                        style={{
                          background: "var(--color-base)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {generatedCode}
                      </pre>
                    </details>
                  )}
                </>
              )}
            </div>
          )}

          {/* Serial */}
          {activeTab === "serial" && <SerialMonitor />}
        </div>
      )}
    </div>
  );
}

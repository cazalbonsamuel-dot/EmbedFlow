import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ReactFlowProvider } from "@xyflow/react";
import { listBoards } from "@embedflow/hardware-db";
import WorkflowCanvas from "./components/Canvas/WorkflowCanvas";
import LeftPanel from "./components/LeftPanel/LeftPanel";
import PropertyPanel from "./components/PropertyPanel/PropertyPanel";
import CodePanel from "./components/CodePanel/CodePanel";
import OutputPanel from "./components/OutputPanel/OutputPanel";
import SimulatorPanel from "./components/Simulator/SimulatorPanel";
import WiringView from "./components/WiringView/WiringView";
import FlashDialog from "./components/FlashDialog/FlashDialog";
import ProjectSelector from "./components/ProjectSelector/ProjectSelector";
import ShortcutDialog from "./components/ShortcutDialog/ShortcutDialog";
import TemplateDialog from "./components/TemplateDialog/TemplateDialog";
import WorkflowTabs from "./components/WorkflowTabs/WorkflowTabs";
import StatusBar from "./components/StatusBar/StatusBar";
import { useWorkflowStore } from "./stores/workflow-store";
import { useSimulationStore } from "./stores/simulation-store";
import { useWiringStore } from "./stores/wiring-store";
import { useCompileStore } from "./stores/compile-store";
import { useFlashStore } from "./stores/flash-store";
import { useProjectStore } from "./stores/project-store";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { exportWorkflow, importWorkflow } from "./services/workflow-io";

function App() {
  const { t, i18n } = useTranslation();

  // Workflow
  const boardId = useWorkflowStore((s) => s.boardId);
  const setBoardId = useWorkflowStore((s) => s.setBoardId);
  const workflowName = useWorkflowStore((s) => s.workflow.name);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const showCodePanel = useWorkflowStore((s) => s.showCodePanel);
  const toggleCodePanel = useWorkflowStore((s) => s.toggleCodePanel);

  // Simulator
  const showSimulator = useSimulationStore((s) => s.showSimulator);
  const toggleSimulator = useSimulationStore((s) => s.toggleSimulator);

  // Wiring
  const showWiringPanel = useWiringStore((s) => s.showWiringPanel);
  const toggleWiringPanel = useWiringStore((s) => s.toggleWiringPanel);

  // Compile
  const compile = useCompileStore((s) => s.compile);
  const compileStatus = useCompileStore((s) => s.status);

  // Flash
  const openFlashDialog = useFlashStore((s) => s.openDialog);

  // Projects
  const syncCurrentProject = useProjectStore((s) => s.syncCurrentProject);

  // UI state
  const [showShortcutDialog, setShowShortcutDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [importToast, setImportToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const boards = listBoards();

  // Sync project on first mount
  useEffect(() => {
    syncCurrentProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (!importToast) return;
    const timer = setTimeout(() => setImportToast(null), 3000);
    return () => clearTimeout(timer);
  }, [importToast]);

  const handleSave = useCallback(() => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  }, []);

  const handleToggleShortcutDialog = useCallback(() => {
    setShowShortcutDialog((prev) => !prev);
  }, []);

  const handleTriggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleShortcutDialog: handleToggleShortcutDialog,
    onTriggerImport: handleTriggerImport,
    onSave: handleSave,
  });

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importWorkflow(file);
      const store = useWorkflowStore.getState();

      store.loadWorkflow(data.workflow, data.nodes, data.edges);

      if (data.allWorkflows && data.allWorkflows.length > 1) {
        const projectWorkflows = data.allWorkflows.map((entry) => ({
          id: entry.workflow.id,
          name: entry.workflow.name,
          isMain: entry.workflow.isMain,
        }));

        const allWorkflowData: Record<string, { workflow: typeof data.workflow; nodes: typeof data.nodes; edges: typeof data.edges }> = {};
        for (const entry of data.allWorkflows) {
          if (entry.workflow.id !== data.workflow.id) {
            allWorkflowData[entry.workflow.id] = entry;
          }
        }

        useWorkflowStore.setState({ projectWorkflows, allWorkflowData });
      }

      syncCurrentProject();
      setImportToast({ type: "success", message: "Workflow importé avec succès !" });
    } catch (err) {
      setImportToast({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur lors de l'import",
      });
    }

    e.target.value = "";
  }, [syncCurrentProject]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");
  };

  // Right panel logic
  const rightPanel = showWiringPanel
    ? "wiring"
    : showSimulator
      ? "simulator"
      : showCodePanel
        ? "code"
        : "property";

  const handleToggleSimulator = () => {
    if (showWiringPanel) toggleWiringPanel();
    toggleSimulator();
  };

  const handleToggleCode = () => {
    if (showWiringPanel) toggleWiringPanel();
    toggleCodePanel();
  };

  const handleToggleWiring = () => {
    toggleWiringPanel();
  };

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col" style={{ background: "var(--color-base)", color: "var(--text-primary)" }}>

        {/* ── Header ── */}
        <header
          className="flex items-center justify-between px-3 shrink-0"
          style={{
            height: "44px",
            background: "var(--color-raised)",
            borderBottom: "1px solid var(--border-dim)",
          }}
        >
          {/* Left zone: logo + project + board */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold tracking-tight shrink-0" style={{ color: "var(--accent)" }}>
              EmbedFlow
            </span>

            <div style={{ width: "1px", height: "16px", background: "var(--border-default)" }} className="shrink-0" />

            <ProjectSelector />

            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="px-2 py-0.5 text-sm rounded bg-transparent border border-transparent hover:border-[var(--border-default)] focus:border-[var(--border-strong)] focus:outline-none w-36 truncate transition-colors"
              style={{ color: "var(--text-secondary)" }}
            />

            {saveIndicator && (
              <span className="text-xs shrink-0" style={{ color: "var(--success)" }}>✓</span>
            )}

            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="px-2 py-0.5 text-xs rounded border focus:outline-none w-36 h-7"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Right zone: actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Ghost: Undo / Redo */}
            <button
              onClick={() => useWorkflowStore.temporal.getState().undo()}
              className="w-7 h-7 flex items-center justify-center rounded text-sm transition-colors duration-100"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
              title="Annuler (Ctrl+Z)"
            >↩</button>
            <button
              onClick={() => useWorkflowStore.temporal.getState().redo()}
              className="w-7 h-7 flex items-center justify-center rounded text-sm transition-colors duration-100"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
              title="Refaire (Ctrl+Y)"
            >↪</button>

            {/* Ghost: Templates */}
            <button
              onClick={() => setShowTemplateDialog(true)}
              className="w-7 h-7 flex items-center justify-center rounded text-xs transition-colors duration-100"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
              title="Templates"
            >📋</button>

            <div style={{ width: "1px", height: "16px", background: "var(--border-default)" }} className="mx-0.5" />

            {/* Secondary: Simulate */}
            <button
              onClick={handleToggleSimulator}
              className="px-2.5 h-7 text-xs rounded border transition-colors duration-100"
              style={rightPanel === "simulator"
                ? { background: "var(--accent-muted)", border: "1px solid var(--accent)", color: "var(--accent)" }
                : { background: "var(--color-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }
              }
              onMouseEnter={(e) => { if (rightPanel !== "simulator") (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; }}
              onMouseLeave={(e) => { if (rightPanel !== "simulator") (e.currentTarget as HTMLElement).style.background = "var(--color-surface)"; }}
            >
              {t("actions.simulate")}
            </button>

            {/* Secondary: Code */}
            <button
              onClick={handleToggleCode}
              className="px-2.5 h-7 text-xs rounded border transition-colors duration-100"
              style={rightPanel === "code"
                ? { background: "var(--accent-muted)", border: "1px solid var(--accent)", color: "var(--accent)" }
                : { background: "var(--color-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }
              }
              onMouseEnter={(e) => { if (rightPanel !== "code") (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; }}
              onMouseLeave={(e) => { if (rightPanel !== "code") (e.currentTarget as HTMLElement).style.background = "var(--color-surface)"; }}
            >
              {t("actions.viewCode")}
            </button>

            {/* Secondary: Wiring */}
            <button
              onClick={handleToggleWiring}
              className="px-2.5 h-7 text-xs rounded border transition-colors duration-100"
              style={rightPanel === "wiring"
                ? { background: "var(--accent-muted)", border: "1px solid var(--accent)", color: "var(--accent)" }
                : { background: "var(--color-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }
              }
              onMouseEnter={(e) => { if (rightPanel !== "wiring") (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; }}
              onMouseLeave={(e) => { if (rightPanel !== "wiring") (e.currentTarget as HTMLElement).style.background = "var(--color-surface)"; }}
              title="Guide de câblage"
            >
              Câblage
            </button>

            <div style={{ width: "1px", height: "16px", background: "var(--border-default)" }} className="mx-0.5" />

            {/* Primary-ish: Compile */}
            <button
              onClick={compile}
              disabled={compileStatus === "compiling"}
              className="px-2.5 h-7 text-xs rounded border transition-colors duration-100 disabled:cursor-wait"
              style={
                compileStatus === "compiling"
                  ? { background: "var(--warning-muted)", border: "1px solid var(--warning)", color: "var(--warning)" }
                  : compileStatus === "success"
                    ? { background: "var(--success-muted)", border: "1px solid var(--success)", color: "var(--success)" }
                    : compileStatus === "error"
                      ? { background: "var(--error-muted)", border: "1px solid var(--error)", color: "var(--error)" }
                      : { background: "var(--color-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }
              }
            >
              {compileStatus === "compiling"
                ? "Compilation..."
                : compileStatus === "success"
                  ? "Compilé ✓"
                  : compileStatus === "error"
                    ? "Erreur ✗"
                    : t("actions.compile")}
            </button>

            {/* Primary: Flash */}
            <button
              onClick={openFlashDialog}
              className="px-2.5 h-7 text-xs rounded font-medium transition-colors duration-100 text-white"
              style={{ background: "var(--accent)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}
            >
              {t("actions.flash")}
            </button>

            <div style={{ width: "1px", height: "16px", background: "var(--border-default)" }} className="mx-0.5" />

            {/* Ghost: Export */}
            <button
              onClick={exportWorkflow}
              className="px-2 h-7 text-xs rounded transition-colors duration-100"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
              title="Exporter (Ctrl+E)"
            >
              {t("actions.export")}
            </button>

            {/* Ghost: Import */}
            <button
              onClick={handleTriggerImport}
              className="px-2 h-7 text-xs rounded transition-colors duration-100"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
              title="Importer"
            >
              {t("actions.import")}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.embedflow.json"
              onChange={handleImportFile}
              className="hidden"
            />

            {/* Ghost: Shortcuts */}
            <button
              onClick={handleToggleShortcutDialog}
              className="w-7 h-7 flex items-center justify-center rounded text-xs transition-colors duration-100"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
              title="Raccourcis (Ctrl+/)"
            >?</button>

            {/* Ghost: Language */}
            <button
              onClick={toggleLanguage}
              className="px-2 h-7 text-xs rounded transition-colors duration-100"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
            >
              {t("language.toggle")}
            </button>
          </div>
        </header>

        {/* Import toast */}
        {importToast && (
          <div
            className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded text-xs shadow-lg"
            style={{
              background: importToast.type === "success" ? "var(--success-muted)" : "var(--error-muted)",
              color: importToast.type === "success" ? "var(--success)" : "var(--error)",
              border: `1px solid ${importToast.type === "success" ? "var(--success)" : "var(--error)"}`,
            }}
          >
            {importToast.message}
          </div>
        )}

        {/* Workflow tabs */}
        <WorkflowTabs />

        {/* Main content */}
        <div className="flex flex-1 min-h-0">
          <LeftPanel />
          <div className="flex-1 flex flex-col min-h-0">
            <WorkflowCanvas />
            <OutputPanel />
          </div>

          {/* Right panel */}
          {rightPanel === "simulator" && <SimulatorPanel />}
          {rightPanel === "code" && <CodePanel />}
          {rightPanel === "wiring" && <WiringView />}
          {rightPanel === "property" && <PropertyPanel />}
        </div>

        {/* Status bar */}
        <StatusBar />
      </div>

      {/* Modals */}
      <FlashDialog />
      <ShortcutDialog open={showShortcutDialog} onClose={() => setShowShortcutDialog(false)} />
      <TemplateDialog open={showTemplateDialog} onClose={() => setShowTemplateDialog(false)} />
    </ReactFlowProvider>
  );
}

export default App;

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ReactFlowProvider } from "@xyflow/react";
import { listBoards } from "@embedflow/hardware-db";
import WorkflowCanvas from "./components/Canvas/WorkflowCanvas";
import ActivityPanel from "./components/ActivityPanel/ActivityPanel";
import PropertyPanel from "./components/PropertyPanel/PropertyPanel";
import CodePanel from "./components/CodePanel/CodePanel";
import OutputPanel from "./components/OutputPanel/OutputPanel";
import SimulatorPanel from "./components/Simulator/SimulatorPanel";
import WiringView from "./components/WiringView/WiringView";
import FlashDialog from "./components/FlashDialog/FlashDialog";
import ProjectSelector from "./components/ProjectSelector/ProjectSelector";
import ShortcutDialog from "./components/ShortcutDialog/ShortcutDialog";
import TemplateDialog from "./components/TemplateDialog/TemplateDialog";
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
      useWorkflowStore.getState().loadWorkflow(data.workflow, data.nodes, data.edges);
      syncCurrentProject();
      setImportToast({ type: "success", message: "Workflow importé avec succès !" });
    } catch (err) {
      setImportToast({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur lors de l'import",
      });
    }

    // Reset file input so re-importing the same file works
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
      <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-blue-400">EmbedFlow</h1>
            <ProjectSelector />
            <div className="flex items-center gap-1.5">
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="px-2 py-1 text-sm bg-transparent border border-transparent hover:border-gray-700 focus:border-blue-500 rounded text-gray-300 focus:outline-none w-44"
              />
              {saveIndicator && (
                <span className="text-xs text-green-400 animate-pulse">✓ Sauvé</span>
              )}
            </div>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Undo / Redo */}
            <button
              onClick={() => useWorkflowStore.temporal.getState().undo()}
              className="px-2 py-1.5 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
              title="Annuler (Ctrl+Z)"
            >
              ↩
            </button>
            <button
              onClick={() => useWorkflowStore.temporal.getState().redo()}
              className="px-2 py-1.5 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
              title="Refaire (Ctrl+Y)"
            >
              ↪
            </button>

            {/* Templates */}
            <button
              onClick={() => setShowTemplateDialog(true)}
              className="px-2 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
              title="Templates"
            >
              📋
            </button>

            <div className="w-px h-6 bg-gray-700 mx-0.5" />

            {/* Simulate */}
            <button
              onClick={handleToggleSimulator}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                rightPanel === "simulator"
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {t("actions.simulate")}
            </button>

            {/* Code */}
            <button
              onClick={handleToggleCode}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                rightPanel === "code"
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {t("actions.viewCode")}
            </button>

            {/* Wiring guide */}
            <button
              onClick={handleToggleWiring}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                rightPanel === "wiring"
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
              title="Guide de câblage"
            >
              Câblage
            </button>

            {/* Compile */}
            <button
              onClick={compile}
              disabled={compileStatus === "compiling"}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                compileStatus === "compiling"
                  ? "bg-yellow-700 text-yellow-200 cursor-wait"
                  : compileStatus === "success"
                    ? "bg-green-700 hover:bg-green-600 text-white"
                    : compileStatus === "error"
                      ? "bg-red-700 hover:bg-red-600 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              } disabled:cursor-wait`}
            >
              {compileStatus === "compiling"
                ? "Compilation..."
                : compileStatus === "success"
                  ? "Compilé"
                  : compileStatus === "error"
                    ? "Erreur"
                    : t("actions.compile")}
            </button>

            {/* Flash */}
            <button
              onClick={openFlashDialog}
              className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              {t("actions.flash")}
            </button>

            <div className="w-px h-6 bg-gray-700 mx-0.5" />

            {/* Export */}
            <button
              onClick={exportWorkflow}
              className="px-2 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
              title="Exporter (Ctrl+E)"
            >
              {t("actions.export")}
            </button>

            {/* Import */}
            <button
              onClick={handleTriggerImport}
              className="px-2 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
              title="Importer"
            >
              {t("actions.import")}
            </button>

            {/* Hidden file input for import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.embedflow.json"
              onChange={handleImportFile}
              className="hidden"
            />

            {/* Shortcut help */}
            <button
              onClick={handleToggleShortcutDialog}
              className="px-2 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
              title="Raccourcis (Ctrl+/)"
            >
              ?
            </button>

            <button
              onClick={toggleLanguage}
              className="px-2 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
            >
              {t("language.toggle")}
            </button>
          </div>
        </header>

        {/* Import toast */}
        {importToast && (
          <div
            className={`absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${
              importToast.type === "success"
                ? "bg-green-900/90 text-green-300 border border-green-700"
                : "bg-red-900/90 text-red-300 border border-red-700"
            }`}
          >
            {importToast.type === "success" ? "✅ " : "❌ "}
            {importToast.message}
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 min-h-0">
          <ActivityPanel />
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
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Modals */}
      <FlashDialog />
      <ShortcutDialog open={showShortcutDialog} onClose={() => setShowShortcutDialog(false)} />
      <TemplateDialog open={showTemplateDialog} onClose={() => setShowTemplateDialog(false)} />
    </ReactFlowProvider>
  );
}

export default App;

import { useTranslation } from "react-i18next";
import { ReactFlowProvider } from "@xyflow/react";
import { listBoards } from "@embedflow/hardware-db";
import WorkflowCanvas from "./components/Canvas/WorkflowCanvas";
import ActivityPanel from "./components/ActivityPanel/ActivityPanel";
import PropertyPanel from "./components/PropertyPanel/PropertyPanel";
import CodePanel from "./components/CodePanel/CodePanel";
import OutputPanel from "./components/OutputPanel/OutputPanel";
import SimulatorPanel from "./components/Simulator/SimulatorPanel";
import { useWorkflowStore } from "./stores/workflow-store";
import { useSimulationStore } from "./stores/simulation-store";

function App() {
  const { t, i18n } = useTranslation();
  const boardId = useWorkflowStore((s) => s.boardId);
  const setBoardId = useWorkflowStore((s) => s.setBoardId);
  const workflowName = useWorkflowStore((s) => s.workflow.name);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const showCodePanel = useWorkflowStore((s) => s.showCodePanel);
  const toggleCodePanel = useWorkflowStore((s) => s.toggleCodePanel);
  const showSimulator = useSimulationStore((s) => s.showSimulator);
  const toggleSimulator = useSimulationStore((s) => s.toggleSimulator);
  const boards = listBoards();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");
  };

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-blue-400">EmbedFlow</h1>
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="px-2 py-1 text-sm bg-transparent border border-transparent hover:border-gray-700 focus:border-blue-500 rounded text-gray-300 focus:outline-none w-48"
            />
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                toggleSimulator();
                if (!showSimulator && showCodePanel) {
                  toggleCodePanel();
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                showSimulator
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {t("actions.simulate")}
            </button>
            <button
              onClick={() => {
                toggleCodePanel();
                if (!showCodePanel && showSimulator) {
                  toggleSimulator();
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                showCodePanel
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {t("actions.viewCode")}
            </button>
            <button className="px-3 py-1.5 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
              {t("actions.compile")}
            </button>
            <button className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
              {t("actions.flash")}
            </button>
            <div className="w-px h-6 bg-gray-700 mx-1" />
            <button
              onClick={toggleLanguage}
              className="px-2 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
            >
              {t("language.toggle")}
            </button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex flex-1 min-h-0">
          <ActivityPanel />
          <div className="flex-1 flex flex-col min-h-0">
            <WorkflowCanvas />
            <OutputPanel />
          </div>
          {showSimulator ? <SimulatorPanel /> : showCodePanel ? <CodePanel /> : <PropertyPanel />}
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;

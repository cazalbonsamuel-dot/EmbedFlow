import { useState } from "react";
import ActivityPanel from "../ActivityPanel/ActivityPanel";
import ProjectTree from "../ProjectTree/ProjectTree";

type LeftTab = "project" | "blocks";

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<LeftTab>("project");

  return (
    <aside className="w-60 border-r border-gray-800 bg-gray-900/30 flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 shrink-0">
        <button
          onClick={() => setActiveTab("project")}
          className={`flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors border-b-2 ${
            activeTab === "project"
              ? "border-blue-500 text-gray-200 bg-gray-900/50"
              : "border-transparent text-gray-500 hover:text-gray-400"
          }`}
        >
          Projet
        </button>
        <button
          onClick={() => setActiveTab("blocks")}
          className={`flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors border-b-2 ${
            activeTab === "blocks"
              ? "border-blue-500 text-gray-200 bg-gray-900/50"
              : "border-transparent text-gray-500 hover:text-gray-400"
          }`}
        >
          Blocs
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "project" && <ProjectTree />}
        {activeTab === "blocks" && <ActivityPanelInner />}
      </div>
    </aside>
  );
}

/**
 * ActivityPanel without the <aside> wrapper — embedded inside LeftPanel.
 */
function ActivityPanelInner() {
  return (
    <div className="h-full">
      <ActivityPanel embedded />
    </div>
  );
}

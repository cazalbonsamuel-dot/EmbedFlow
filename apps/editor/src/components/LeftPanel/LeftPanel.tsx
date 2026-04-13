import { useState } from "react";
import ActivityPanel from "../ActivityPanel/ActivityPanel";
import ProjectTree from "../ProjectTree/ProjectTree";

type LeftTab = "project" | "blocks";

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<LeftTab>("project");

  return (
    <aside
      className="flex flex-col h-full shrink-0"
      style={{
        width: "240px",
        borderRight: "1px solid var(--border-dim)",
        background: "var(--color-raised)",
      }}
    >
      {/* Tab bar */}
      <div
        className="flex shrink-0"
        style={{ borderBottom: "1px solid var(--border-dim)", height: "32px" }}
      >
        {(["project", "blocks"] as const).map((tab) => {
          const label = tab === "project" ? "Projet" : "Blocs";
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 flex items-center justify-center text-xs font-medium transition-colors duration-100 relative"
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                background: isActive ? "var(--color-overlay)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
              }}
            >
              {label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-px"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "project" && <ProjectTree />}
        {activeTab === "blocks" && <ActivityPanel embedded />}
      </div>
    </aside>
  );
}

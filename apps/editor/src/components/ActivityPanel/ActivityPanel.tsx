import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getCategories, listByCategory } from "@embedflow/activity-registry";
import type { ActivityDefinition } from "@embedflow/activity-registry";
import { useWorkflowStore } from "../../stores/workflow-store";

const categoryIcons: Record<string, string> = {
  Controle: "💡",
  Capteurs: "🌡️",
  Actuateurs: "⚙️",
  Affichage: "📟",
  Logique: "🔀",
  Temps: "⏱️",
  Communication: "📡",
  Variables: "🧮",
  "Sous-programmes": "◈",
};

function ActivityItem({ activity, disabled }: { activity: ActivityDefinition; disabled: boolean }) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData("application/embedflow-activity", activity.id);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-grab active:cursor-grabbing transition-colors duration-100"
      style={
        disabled
          ? { color: "var(--text-tertiary)", cursor: "not-allowed", opacity: 0.4 }
          : { color: "var(--text-secondary)", background: "transparent" }
      }
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)";
      }}
      onMouseLeave={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
      title={disabled ? "Non compatible avec la carte sélectionnée" : activity.description}
    >
      <span className="text-sm shrink-0 leading-none">{activity.icon}</span>
      <span className="truncate">{activity.label}</span>
    </div>
  );
}

export default function ActivityPanel({ embedded }: { embedded?: boolean } = {}) {
  const { t } = useTranslation();
  const boardId = useWorkflowStore((s) => s.boardId);
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(getCategories()));

  const categories = getCategories();

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const content = (
    <>
      {/* Search */}
      <div className="p-2 shrink-0" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <input
          type="text"
          placeholder={t("workflow.addNode")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs rounded focus:outline-none"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {categories.map((cat) => {
          const activities = listByCategory(cat).filter(
            (a) => !search || a.label.toLowerCase().includes(search.toLowerCase()),
          );
          if (activities.length === 0) return null;

          const isOpen = openCategories.has(cat);

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest transition-colors duration-100"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
              >
                <span className="text-[11px]">{categoryIcons[cat] || "·"}</span>
                <span className="flex-1 text-left">{cat}</span>
                <span className="text-[8px]">{isOpen ? "▼" : "▶"}</span>
              </button>

              {isOpen && (
                <div className="space-y-px ml-1 mb-1">
                  {activities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      disabled={!activity.supportedBoards.includes(boardId)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div
      className="flex flex-col h-full"
      style={!embedded ? { width: "240px", borderRight: "1px solid var(--border-dim)", background: "var(--color-raised)" } : {}}
    >
      {content}
    </div>
  );
}

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
  "Sous-programmes": "📎",
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
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-grab active:cursor-grabbing transition-colors ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-gray-800/30 text-gray-600"
          : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/70"
      }`}
      title={disabled ? "Non compatible avec la carte selectionnee" : activity.description}
    >
      <span className="text-base shrink-0">{activity.icon}</span>
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
      <div className="p-3 border-b border-gray-800">
        <input
          type="text"
          placeholder={t("workflow.addNode")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
              >
                <span className="text-sm">{categoryIcons[cat] || "📦"}</span>
                <span className="flex-1 text-left">{cat}</span>
                <span className="text-[10px]">{isOpen ? "▼" : "▶"}</span>
              </button>

              {isOpen && (
                <div className="space-y-1 ml-1 mb-2">
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

  if (embedded) {
    return <div className="flex flex-col h-full">{content}</div>;
  }

  return (
    <aside className="w-60 border-r border-gray-800 bg-gray-900/30 flex flex-col h-full">
      {content}
    </aside>
  );
}

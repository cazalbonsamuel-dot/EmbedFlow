import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getActivity } from "@embedflow/activity-registry";
import { useWorkflowStore } from "../../stores/workflow-store";
import PropertyField from "./PropertyField";

export default function PropertyPanel() {
  const { t } = useTranslation();
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const nodes = useWorkflowStore((s) => s.nodes);
  const updateNodeProperties = useWorkflowStore((s) => s.updateNodeProperties);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const [showOptions, setShowOptions] = useState(false);
  const [showExpert, setShowExpert] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const activity = selectedNode ? getActivity(selectedNode.data.activityId) : null;

  if (!selectedNode || !activity) {
    return (
      <aside className="w-72 border-l border-gray-800 bg-gray-900/30 p-4 flex flex-col">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {t("nav.settings")}
        </h2>
        <p className="text-sm text-gray-600 mt-4">{t("properties.selectBlock")}</p>
      </aside>
    );
  }

  const properties = selectedNode.data.properties;

  const handleChange = (propName: string, value: unknown) => {
    const newProps = { ...properties, [propName]: value };
    updateNodeProperties(selectedNode.id, newProps);
  };

  const essentialProps = activity.properties.filter((p) => p.level === "essential");
  const optionsProps = activity.properties.filter((p) => p.level === "options");
  const expertProps = activity.properties.filter((p) => p.level === "expert");

  // Validate
  const validationResult = activity.validate(properties, {
    usedPins: new Set<number>(),
    boardId: useWorkflowStore.getState().boardId,
  });

  return (
    <aside className="w-72 border-l border-gray-800 bg-gray-900/30 flex flex-col h-full">
      {/* Activity header */}
      <div
        className="flex items-center gap-3 px-4 py-3 text-white"
        style={{ backgroundColor: activity.color }}
      >
        <span className="text-xl">{activity.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{activity.label}</div>
          <div className="text-xs opacity-75 truncate">{activity.description}</div>
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Essential */}
        {essentialProps.map((prop) => (
          <div key={prop.name}>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              {prop.label}
              {prop.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <PropertyField
              property={prop}
              value={properties[prop.name]}
              onChange={(v) => handleChange(prop.name, v)}
            />
            {prop.helpText && (
              <p className="text-[11px] text-gray-600 mt-0.5">{prop.helpText}</p>
            )}
          </div>
        ))}

        {/* Options */}
        {optionsProps.length > 0 && (
          <div className="border-t border-gray-800 pt-3">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 w-full"
            >
              <span>{showOptions ? "▼" : "▶"}</span>
              <span>{t("properties.options")}</span>
            </button>
            {showOptions && (
              <div className="mt-3 space-y-4">
                {optionsProps.map((prop) => (
                  <div key={prop.name}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      {prop.label}
                    </label>
                    <PropertyField
                      property={prop}
                      value={properties[prop.name]}
                      onChange={(v) => handleChange(prop.name, v)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expert */}
        {expertProps.length > 0 && (
          <div className="border-t border-gray-800 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t("properties.expert")}
              </span>
              <button
                onClick={() => setShowExpert(!showExpert)}
                className={`relative w-8 h-4 rounded-full transition-colors ${
                  showExpert ? "bg-blue-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    showExpert ? "left-4" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            {showExpert && (
              <div className="mt-3 space-y-4">
                {expertProps.map((prop) => (
                  <div key={prop.name}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      {prop.label}
                    </label>
                    <PropertyField
                      property={prop}
                      value={properties[prop.name]}
                      onChange={(v) => handleChange(prop.name, v)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Validation messages */}
        {!validationResult.valid && (
          <div className="border-t border-gray-800 pt-3 space-y-1">
            {validationResult.messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-red-400 shrink-0 mt-0.5">!</span>
                <span className="text-red-300">{msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete button */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => removeNode(selectedNode.id)}
          className="w-full px-3 py-1.5 text-sm rounded-md bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 transition-colors"
        >
          {t("workflow.deleteNode")}
        </button>
      </div>
    </aside>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getActivity } from "@embedflow/activity-registry";
import { useWorkflowStore } from "../../stores/workflow-store";
import PropertyField from "./PropertyField";
import WorkflowArgumentsEditor from "../WorkflowArguments/WorkflowArgumentsEditor";

export default function PropertyPanel() {
  const { t } = useTranslation();
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const nodes = useWorkflowStore((s) => s.nodes);
  const updateNodeProperties = useWorkflowStore((s) => s.updateNodeProperties);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const [showOptions, setShowOptions] = useState(false);
  const [showExpert, setShowExpert] = useState(false);

  const workflow = useWorkflowStore((s) => s.workflow);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const activity = selectedNode ? getActivity(selectedNode.data.activityId) : null;

  if (!selectedNode || !activity) {
    if (!workflow.isMain) {
      return <WorkflowArgumentsEditor />;
    }
    return (
      <aside
        className="flex flex-col h-full shrink-0"
        style={{
          width: "272px",
          borderLeft: "1px solid var(--border-dim)",
          background: "var(--color-raised)",
        }}
      >
        <div
          className="px-3 py-2 shrink-0"
          style={{ borderBottom: "1px solid var(--border-dim)", height: "36px", display: "flex", alignItems: "center" }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
          >
            {t("nav.settings")}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p
            className="text-xs text-center px-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("properties.selectBlock")}
          </p>
        </div>
      </aside>
    );
  }

  const properties = selectedNode.data.properties;

  const handleChange = (propName: string, value: unknown) => {
    const newProps = { ...properties, [propName]: value };
    updateNodeProperties(selectedNode.id, newProps);
  };

  const projectWorkflows = useWorkflowStore((s) => s.projectWorkflows);
  const isInvokeNode = selectedNode.data.activityId === "workflow.invoke";

  const essentialProps = activity.properties.filter((p) => p.level === "essential");
  const optionsProps = activity.properties.filter((p) => p.level === "options");
  const expertProps = activity.properties.filter((p) => p.level === "expert");

  const validationResult = activity.validate(properties, {
    usedPins: new Set<number>(),
    boardId: useWorkflowStore.getState().boardId,
  });

  return (
    <aside
      className="flex flex-col h-full shrink-0"
      style={{
        width: "272px",
        borderLeft: "1px solid var(--border-dim)",
        background: "var(--color-raised)",
      }}
    >
      {/* Activity header with left accent */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 shrink-0 relative overflow-hidden"
        style={{
          borderBottom: "1px solid var(--border-dim)",
          background: "var(--color-surface)",
        }}
      >
        {/* Color strip */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: "3px", background: activity.color }}
        />
        <span className="text-lg leading-none shrink-0 ml-1">{activity.icon}</span>
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {activity.label}
          </div>
          <div
            className="text-[10px] truncate"
            style={{ color: "var(--text-tertiary)" }}
          >
            {activity.description}
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Essential */}
        {essentialProps.map((prop) => (
          <div key={prop.name}>
            <label
              className="block text-[10px] font-medium mb-1 uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
            >
              {prop.label}
              {prop.required && <span style={{ color: "var(--error)" }} className="ml-1">*</span>}
            </label>

            {isInvokeNode && prop.name === "targetWorkflowId" ? (
              <select
                value={(properties[prop.name] as string) ?? ""}
                onChange={(e) => handleChange(prop.name, e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded focus:outline-none"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
              >
                <option value="">— Choisir un sous-workflow —</option>
                {projectWorkflows
                  .filter((w) => !w.isMain && w.id !== workflow.id)
                  .map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
              </select>
            ) : (
              <PropertyField
                property={prop}
                value={properties[prop.name]}
                onChange={(v) => handleChange(prop.name, v)}
              />
            )}

            {prop.helpText && (
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                {prop.helpText}
              </p>
            )}
          </div>
        ))}

        {/* Options */}
        {optionsProps.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "12px" }}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider w-full transition-colors duration-100"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
            >
              <span className="text-[8px]">{showOptions ? "▼" : "▶"}</span>
              <span>{t("properties.options")}</span>
            </button>
            {showOptions && (
              <div className="mt-3 space-y-3">
                {optionsProps.map((prop) => (
                  <div key={prop.name}>
                    <label
                      className="block text-[10px] font-medium mb-1 uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
                    >
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
          <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "12px" }}>
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
              >
                {t("properties.expert")}
              </span>
              <button
                onClick={() => setShowExpert(!showExpert)}
                className="relative rounded-full transition-colors duration-100"
                style={{
                  width: "28px",
                  height: "14px",
                  background: showExpert ? "var(--accent)" : "var(--color-subtle)",
                }}
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white transition-all duration-100"
                  style={{
                    width: "10px",
                    height: "10px",
                    left: showExpert ? "15px" : "2px",
                  }}
                />
              </button>
            </div>
            {showExpert && (
              <div className="mt-3 space-y-3">
                {expertProps.map((prop) => (
                  <div key={prop.name}>
                    <label
                      className="block text-[10px] font-medium mb-1 uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
                    >
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
          <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "12px" }} className="space-y-1">
            {validationResult.messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span style={{ color: "var(--error)" }} className="shrink-0 mt-0.5">!</span>
                <span style={{ color: "var(--error)" }}>{msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete button */}
      <div className="p-2 shrink-0" style={{ borderTop: "1px solid var(--border-dim)" }}>
        <button
          onClick={() => removeNode(selectedNode.id)}
          className="w-full px-3 py-1.5 text-xs rounded transition-colors duration-100"
          style={{
            background: "var(--error-muted)",
            border: "1px solid transparent",
            color: "var(--error)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--error)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
          }}
        >
          {t("workflow.deleteNode")}
        </button>
      </div>
    </aside>
  );
}

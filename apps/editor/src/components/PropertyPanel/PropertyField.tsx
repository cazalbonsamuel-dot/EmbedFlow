import type { PropertyDef } from "@embedflow/activity-registry";
import { useWorkflowStore } from "../../stores/workflow-store";
import PinSelector from "./PinSelector";

interface PropertyFieldProps {
  property: PropertyDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

const inputStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--border-default)",
  color: "var(--text-primary)",
  width: "100%",
  padding: "5px 10px",
  borderRadius: "4px",
  fontSize: "12px",
  height: "28px",
  outline: "none",
  transition: "border-color 100ms",
} as const;

export default function PropertyField({ property, value, onChange }: PropertyFieldProps) {

  switch (property.type) {
    case "choice":
      return (
        <select
          value={(value as string) ?? property.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
          onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
        >
          <option value="">— Choisir —</option>
          {property.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon ? `${opt.icon} ` : ""}{opt.label}
            </option>
          ))}
        </select>
      );

    case "pin":
      return (
        <PinSelector
          value={value as number | undefined}
          onChange={(pin) => onChange(pin)}
          filterRule={property.validation?.rule}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={(value as number) ?? property.default ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          style={inputStyle}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
          onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
        />
      );

    case "slider": {
      const min = property.validation?.rule.includes("range:")
        ? Number(property.validation.rule.split(":")[1]?.split("-")[0])
        : 0;
      const max = property.validation?.rule.includes("range:")
        ? Number(property.validation.rule.split(":")[1]?.split("-")[1])
        : 100;
      const val = (value as number) ?? (property.default as number) ?? min;

      return (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={min}
            max={max}
            value={val}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--accent)", height: "4px" }}
          />
          <span
            className="text-xs font-mono w-8 text-right shrink-0"
            style={{ color: "var(--text-secondary)" }}
          >
            {val}
          </span>
        </div>
      );
    }

    case "toggle":
      return (
        <button
          onClick={() => onChange(!value)}
          className="relative rounded-full transition-colors duration-100"
          style={{
            width: "32px",
            height: "16px",
            background: value ? "var(--accent)" : "var(--color-subtle)",
          }}
        >
          <span
            className="absolute top-0.5 rounded-full bg-white transition-all duration-100"
            style={{
              width: "12px",
              height: "12px",
              left: value ? "17px" : "2px",
            }}
          />
        </button>
      );

    case "text":
      return (
        <input
          type="text"
          value={(value as string) ?? property.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          placeholder={property.helpText}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
          onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
        />
      );

    case "variable": {
      const workflow = useWorkflowStore.getState().workflow;
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
          onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
        >
          <option value="">— Variable —</option>
          {workflow.variables.map((v) => (
            <option key={v.id} value={v.name}>
              {v.name} ({v.type})
            </option>
          ))}
        </select>
      );
    }

    default:
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
          onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
        />
      );
  }
}

import type { PropertyDef } from "@embedflow/activity-registry";
import { useWorkflowStore } from "../../stores/workflow-store";
import PinSelector from "./PinSelector";

interface PropertyFieldProps {
  property: PropertyDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

export default function PropertyField({ property, value, onChange }: PropertyFieldProps) {

  const baseInputClass =
    "w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500";

  switch (property.type) {
    case "choice":
      return (
        <select
          value={(value as string) ?? property.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          <option value="">-- Choisir --</option>
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
          className={baseInputClass}
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
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            value={val}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-sm text-gray-400 w-10 text-right">{val}</span>
        </div>
      );
    }

    case "toggle":
      return (
        <button
          onClick={() => onChange(!value)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            value ? "bg-blue-500" : "bg-gray-600"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              value ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      );

    case "text":
      return (
        <input
          type="text"
          value={(value as string) ?? property.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          placeholder={property.helpText}
        />
      );

    case "variable": {
      const workflow = useWorkflowStore.getState().workflow;
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          <option value="">-- Variable --</option>
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
          className={baseInputClass}
        />
      );
  }
}

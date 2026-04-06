import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const interval: ActivityDefinition = {
  id: "timing.interval",
  category: "Temps",
  label: "Toutes les X secondes",
  icon: "⏲️",
  description: "Execute des actions a intervalle regulier (non-bloquant)",
  color: "#06b6d4",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "intervalle", label: "Intervalle", type: "number", required: true, level: "essential", default: 1000 },
    { name: "unite", label: "Unite", type: "choice", required: true, level: "essential", default: "ms",
      options: [{ label: "Millisecondes", value: "ms" }, { label: "Secondes", value: "sec" }, { label: "Minutes", value: "min" }] },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_body", name: "Faire", type: "execution" }],
  codegen: {
    libraries: [], includes: [],
    globals: () => "unsigned long lastRun = 0;",
    setup: () => "",
    loop: (props) => {
      const val = props.intervalle as number || 1000;
      const unite = props.unite as string || "ms";
      let ms = val;
      if (unite === "sec") ms = val * 1000;
      if (unite === "min") ms = val * 60000;
      return `if (millis() - lastRun >= ${ms}) {\n  lastRun = millis();\n  // Actions a intervalle\n}`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    const val = props.intervalle as number;
    if (val === undefined || val <= 0) messages.push("L'intervalle doit etre superieur a 0.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: 1000, range: [100, 60000], unit: "ms", controlType: "slider" },
};
registerActivity(interval);
export default interval;

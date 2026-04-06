import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const switchCase: ActivityDefinition = {
  id: "logic.switch_case",
  category: "Logique",
  label: "Choisir parmi...",
  icon: "🔀",
  description: "Execute une branche differente selon la valeur d'une variable",
  color: "#8b5cf6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "variable", label: "Variable a tester", type: "variable", required: true, level: "essential" },
    { name: "cas1", label: "Cas 1 (valeur)", type: "number", required: true, level: "essential", default: 1 },
    { name: "cas2", label: "Cas 2 (valeur)", type: "number", required: false, level: "essential", default: 2 },
    { name: "cas3", label: "Cas 3 (valeur)", type: "number", required: false, level: "options", default: 3 },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_cas1", name: "Cas 1", type: "execution" },
    { id: "exec_cas2", name: "Cas 2", type: "execution" },
    { id: "exec_cas3", name: "Cas 3", type: "execution" },
    { id: "exec_default", name: "Par defaut", type: "execution" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const v = props.variable as string || "valeur";
      let code = `switch ((int)${v}) {`;
      if (props.cas1 !== undefined) code += `\n  case ${props.cas1}:\n    // Cas 1\n    break;`;
      if (props.cas2 !== undefined) code += `\n  case ${props.cas2}:\n    // Cas 2\n    break;`;
      if (props.cas3 !== undefined) code += `\n  case ${props.cas3}:\n    // Cas 3\n    break;`;
      code += `\n  default:\n    // Par defaut\n    break;\n}`;
      return code;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.variable) messages.push("Veuillez choisir une variable a tester.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: 1, range: [1, 3], controlType: "slider" },
};
registerActivity(switchCase);
export default switchCase;

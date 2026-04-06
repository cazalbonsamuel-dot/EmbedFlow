import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const calculate: ActivityDefinition = {
  id: "variables.calculate",
  category: "Variables",
  label: "Calculer",
  icon: "🧮",
  description: "Effectue un calcul arithmetique",
  color: "#ec4899",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "operande_a", label: "Valeur A", type: "text", required: true, level: "essential", default: "temperature",
      helpText: "Variable ou nombre" },
    { name: "operateur", label: "Operation", type: "choice", required: true, level: "essential", default: "+",
      options: [
        { label: "Plus (+)", value: "+" }, { label: "Moins (-)", value: "-" },
        { label: "Fois (x)", value: "*" }, { label: "Divise par (/)", value: "/" },
        { label: "Modulo (%)", value: "%" },
      ] },
    { name: "operande_b", label: "Valeur B", type: "text", required: true, level: "essential", default: "1.8",
      helpText: "Variable ou nombre" },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "resultat", name: "Resultat", type: "number" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const a = props.operande_a as string || "0";
      const op = props.operateur as string || "+";
      const b = props.operande_b as string || "0";
      return `float resultat = (float)(${a}) ${op} (float)(${b});`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.operande_a) messages.push("Veuillez entrer la valeur A.");
    if (!props.operande_b) messages.push("Veuillez entrer la valeur B.");
    if (props.operateur === "/" && props.operande_b === "0") messages.push("Division par zero !");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: 0, controlType: "input" },
};
registerActivity(calculate);
export default calculate;

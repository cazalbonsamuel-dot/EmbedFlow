import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const compare: ActivityDefinition = {
  id: "variables.compare",
  category: "Variables",
  label: "Comparer",
  icon: "⚖️",
  description: "Compare deux valeurs et retourne vrai ou faux",
  color: "#ec4899",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "valeur_a", label: "Valeur A", type: "text", required: true, level: "essential",
      helpText: "Variable ou nombre" },
    { name: "operateur", label: "Comparaison", type: "choice", required: true, level: "essential", default: ">",
      options: [
        { label: "est superieure a", value: ">" }, { label: "est inferieure a", value: "<" },
        { label: "est egale a", value: "==" }, { label: "est differente de", value: "!=" },
        { label: "est superieure ou egale a", value: ">=" }, { label: "est inferieure ou egale a", value: "<=" },
      ] },
    { name: "valeur_b", label: "Valeur B", type: "text", required: true, level: "essential",
      helpText: "Variable ou nombre" },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "resultat", name: "Resultat", type: "boolean" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => `bool resultat = (${props.valeur_a || "0"} ${props.operateur || ">"} ${props.valeur_b || "0"});`,
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.valeur_a) messages.push("Veuillez entrer la valeur A.");
    if (!props.valeur_b) messages.push("Veuillez entrer la valeur B.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: true, controlType: "toggle" },
};
registerActivity(compare);
export default compare;

import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const mapRange: ActivityDefinition = {
  id: "variables.map_range",
  category: "Variables",
  label: "Convertir une plage",
  icon: "🔄",
  description: "Convertit une valeur d'une plage vers une autre",
  color: "#ec4899",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "variable", label: "Variable", type: "variable", required: true, level: "essential" },
    { name: "de_min", label: "De : minimum", type: "number", required: true, level: "essential", default: 0 },
    { name: "de_max", label: "De : maximum", type: "number", required: true, level: "essential", default: 1023 },
    { name: "vers_min", label: "Vers : minimum", type: "number", required: true, level: "essential", default: 0 },
    { name: "vers_max", label: "Vers : maximum", type: "number", required: true, level: "essential", default: 100 },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "valeur", name: "Valeur convertie", type: "number" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const v = props.variable as string || "valeur";
      return `float valeur_convertie = map(${v}, ${props.de_min ?? 0}, ${props.de_max ?? 1023}, ${props.vers_min ?? 0}, ${props.vers_max ?? 100});`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.variable) messages.push("Veuillez choisir une variable.");
    if (props.de_min === props.de_max) messages.push("La plage source ne peut pas etre nulle.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: 512, range: [0, 1023], controlType: "slider" },
};
registerActivity(mapRange);
export default mapRange;

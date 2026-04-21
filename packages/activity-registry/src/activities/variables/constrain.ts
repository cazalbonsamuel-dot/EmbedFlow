import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const constrainActivity: ActivityDefinition = {
  id: "variables.constrain",
  category: "Variables",
  label: "Limiter une valeur",
  icon: "📐",
  description: "Limite une valeur entre un minimum et un maximum",
  color: "#ec4899",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "variable", label: "Variable", type: "variable", required: true, level: "essential" },
    { name: "minimum", label: "Minimum", type: "number", required: true, level: "essential", default: 0 },
    { name: "maximum", label: "Maximum", type: "number", required: true, level: "essential", default: 100 },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "valeur", name: "Valeur limitee", type: "number" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const v = props.variable as string || "valeur";
      return `float valeur_limitee = constrain(${v}, ${props.minimum ?? 0}, ${props.maximum ?? 100});`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.variable) messages.push("Veuillez choisir une variable.");
    if ((props.minimum as number) >= (props.maximum as number)) messages.push("Le minimum doit etre inferieur au maximum.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: 50, range: [0, 100], controlType: "slider" },
};
registerActivity(constrainActivity);
export default constrainActivity;

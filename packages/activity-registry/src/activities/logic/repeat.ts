import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const repeat: ActivityDefinition = {
  id: "logic.repeat",
  category: "Logique",
  label: "Repeter X fois",
  icon: "🔢",
  description: "Repete des actions un nombre de fois precis",
  color: "#8b5cf6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "nombre", label: "Nombre de repetitions", type: "number", required: true, level: "essential", default: 10 },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_body", name: "Faire (corps)", type: "execution" },
    { id: "exec_out", name: "Apres la boucle", type: "execution" },
    { id: "compteur", name: "N° du tour", type: "number" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const n = props.nombre as number || 10;
      return `for (int i = 0; i < ${n}; i++) {\n  // Corps de la boucle (i = numero du tour)\n}`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    const n = props.nombre as number;
    if (n === undefined || n <= 0) messages.push("Le nombre de repetitions doit etre superieur a 0.");
    if (n > 10000) messages.push("Attention : plus de 10000 repetitions peut ralentir le programme.");
    return { valid: messages.filter((m) => !m.startsWith("Attention")).length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: 10, range: [1, 100], unit: "fois", controlType: "slider" },
};
registerActivity(repeat);
export default repeat;

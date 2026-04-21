import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const readPotentiometer: ActivityDefinition = {
  id: "sensors.read_potentiometer",
  category: "Capteurs",
  label: "Lire un potentiometre",
  icon: "🎛️",
  description: "Lit la valeur d'un potentiometre (bouton rotatif)",
  color: "#3b82f6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin", label: "Pin analogique", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.analog", errorMessage: "Le potentiometre a besoin d'un pin analogique" } },
    { name: "plage_max", label: "Plage de sortie max", type: "number", required: false, level: "options", default: 100 },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "valeur", name: "Valeur", type: "number" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const max = props.plage_max as number || 100;
      return `int pot_brut = analogRead(${props.pin});\nfloat valeur = map(pot_brut, 0, 1023, 0, ${max});`;
    },
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin analogique.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: "Potentiometre (broche 1)", to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Alimentation" },
    { from: "Potentiometre (broche 2 / curseur)", to: `Pin ${props.pin}`, color: "green", label: "Signal" },
    { from: "Potentiometre (broche 3)", to: "GND", color: "black", label: "Masse" },
  ],
  simulate: { defaultValue: 50, range: [0, 100], unit: "", controlType: "slider" },
};
registerActivity(readPotentiometer);
export default readPotentiometer;

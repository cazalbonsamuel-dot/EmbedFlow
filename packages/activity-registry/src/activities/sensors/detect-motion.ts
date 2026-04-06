import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const detectMotion: ActivityDefinition = {
  id: "sensors.detect_motion",
  category: "Capteurs",
  label: "Detecter un mouvement",
  icon: "🚶",
  description: "Detecte un mouvement avec un capteur PIR",
  color: "#3b82f6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin", label: "Branche sur", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.digital", errorMessage: "Le capteur PIR a besoin d'un pin digital" } },
    { name: "duree_detection", label: "Duree min. de detection (sec)", type: "number", required: false, level: "options", default: 2 },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "mouvement", name: "Mouvement detecte", type: "boolean" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: (props) => `pinMode(${props.pin}, INPUT);`,
    loop: (props) => `bool mouvement = digitalRead(${props.pin}) == HIGH;`,
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: "PIR VCC", to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Alimentation" },
    { from: "PIR GND", to: "GND", color: "black", label: "Masse" },
    { from: "PIR OUT", to: `Pin ${props.pin}`, color: "green", label: "Signal" },
  ],
  simulate: { defaultValue: false, controlType: "toggle" },
};
registerActivity(detectMotion);
export default detectMotion;

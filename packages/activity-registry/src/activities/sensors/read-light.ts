import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const readLight: ActivityDefinition = {
  id: "sensors.read_light",
  category: "Capteurs",
  label: "Lire la luminosite",
  icon: "☀️",
  description: "Mesure la luminosite ambiante avec une photoresistance (LDR)",
  color: "#3b82f6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin", label: "Pin analogique", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.analog", errorMessage: "La LDR a besoin d'un pin analogique" } },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "luminosite", name: "Luminosite", type: "number" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => `int luminosite_brute = analogRead(${props.pin});\nfloat luminosite = map(luminosite_brute, 0, 1023, 0, 100);`,
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin analogique.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: "LDR (branche 1)", to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Alimentation" },
    { from: "LDR (branche 2)", to: `Pin ${props.pin}`, color: "green", label: "Signal" },
    { from: "Resistance 10kΩ", to: `Pin ${props.pin} <-> GND`, color: "brown", label: "Diviseur de tension" },
  ],
  simulate: { defaultValue: 50, range: [0, 100], unit: "%", controlType: "slider" },
};
registerActivity(readLight);
export default readLight;

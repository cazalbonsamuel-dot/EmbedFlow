import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const relay: ActivityDefinition = {
  id: "actuators.relay",
  category: "Actuateurs",
  label: "Activer un relais",
  icon: "🔌",
  description: "Active ou desactive un relais pour controler un appareil",
  color: "#10b981",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin", label: "Branche sur", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.digital", errorMessage: "Le relais a besoin d'un pin digital" } },
    { name: "etat", label: "Etat", type: "choice", required: true, level: "essential", default: "on",
      options: [{ label: "Active", value: "on" }, { label: "Desactive", value: "off" }] },
    { name: "logique_inversee", label: "Logique inversee", type: "toggle", required: false, level: "options", default: false,
      helpText: "Certains relais s'activent sur LOW" },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: (props) => `pinMode(${props.pin}, OUTPUT);`,
    loop: (props) => {
      const on = props.etat === "on";
      const inv = props.logique_inversee as boolean;
      const level = (on !== inv) ? "HIGH" : "LOW";
      return `digitalWrite(${props.pin}, ${level});`;
    },
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: "Relais VCC", to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Alimentation" },
    { from: "Relais GND", to: "GND", color: "black", label: "Masse" },
    { from: "Relais IN", to: `Pin ${props.pin}`, color: "blue", label: "Commande" },
  ],
  simulate: { defaultValue: false, controlType: "toggle" },
};
registerActivity(relay);
export default relay;

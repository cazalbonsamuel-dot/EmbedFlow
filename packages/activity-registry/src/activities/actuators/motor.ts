import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const motor: ActivityDefinition = {
  id: "actuators.motor",
  category: "Actuateurs",
  label: "Controler un moteur",
  icon: "⚙️",
  description: "Controle la vitesse et direction d'un moteur DC via pont H",
  color: "#10b981",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin_vitesse", label: "Pin vitesse (PWM)", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.pwm", errorMessage: "La vitesse a besoin d'un pin PWM" } },
    { name: "pin_direction", label: "Pin direction", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.digital", errorMessage: "La direction a besoin d'un pin digital" } },
    { name: "vitesse", label: "Vitesse (%)", type: "slider", required: true, level: "essential", default: 50,
      validation: { rule: "range:0-100", errorMessage: "La vitesse doit etre entre 0 et 100%" } },
    { name: "direction", label: "Direction", type: "choice", required: false, level: "options", default: "avant",
      options: [{ label: "Avant", value: "avant" }, { label: "Arriere", value: "arriere" }] },
    { name: "frein", label: "Freiner", type: "toggle", required: false, level: "options", default: false },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: (props) => `pinMode(${props.pin_vitesse}, OUTPUT);\npinMode(${props.pin_direction}, OUTPUT);`,
    loop: (props) => {
      if (props.frein) return `analogWrite(${props.pin_vitesse}, 0); // Frein`;
      const pwm = Math.round(((props.vitesse as number) || 50) / 100 * 255);
      const dir = props.direction === "arriere" ? "LOW" : "HIGH";
      return `digitalWrite(${props.pin_direction}, ${dir});\nanalogWrite(${props.pin_vitesse}, ${pwm}); // ${props.vitesse}%`;
    },
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin_vitesse === undefined) messages.push("Veuillez selectionner le pin vitesse.");
    if (props.pin_direction === undefined) messages.push("Veuillez selectionner le pin direction.");
    if (props.pin_vitesse === props.pin_direction) messages.push("Les pins vitesse et direction doivent etre differents.");
    if (props.pin_vitesse !== undefined && ctx.usedPins.has(props.pin_vitesse as number)) messages.push(`Le pin ${props.pin_vitesse} est deja utilise.`);
    if (props.pin_direction !== undefined && ctx.usedPins.has(props.pin_direction as number)) messages.push(`Le pin ${props.pin_direction} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: "L298N VCC", to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Logique" },
    { from: "L298N GND", to: "GND", color: "black", label: "Masse" },
    { from: "L298N ENA", to: `Pin ${props.pin_vitesse}`, color: "orange", label: "Vitesse (PWM)" },
    { from: "L298N IN1", to: `Pin ${props.pin_direction}`, color: "blue", label: "Direction" },
    { from: "Alimentation moteur", to: "L298N VS", color: "red", label: "12V moteur" },
  ],
  simulate: { defaultValue: 50, range: [0, 100], unit: "%", controlType: "slider" },
};
registerActivity(motor);
export default motor;

import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const servo: ActivityDefinition = {
  id: "actuators.servo",
  category: "Actuateurs",
  label: "Tourner un servo",
  icon: "🔄",
  description: "Controle l'angle d'un servomoteur",
  color: "#10b981",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin", label: "Branche sur", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.pwm", errorMessage: "Le servo a besoin d'un pin PWM" } },
    { name: "angle", label: "Angle", type: "slider", required: true, level: "essential", default: 90,
      validation: { rule: "range:0-180", errorMessage: "L'angle doit etre entre 0 et 180 degres" } },
    { name: "vitesse", label: "Vitesse de rotation", type: "choice", required: false, level: "options", default: "rapide",
      options: [{ label: "Rapide", value: "rapide" }, { label: "Lent", value: "lent" }] },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [{ name: "Servo", version: "^1.2" }],
    includes: ["Servo.h"],
    globals: (props) => `Servo servo_${props.pin};`,
    setup: (props) => `servo_${props.pin}.attach(${props.pin});`,
    loop: (props) => {
      const angle = props.angle as number || 90;
      if (props.vitesse === "lent") {
        return `// Rotation lente vers ${angle} degres\nfor (int pos = servo_${props.pin}.read(); pos != ${angle}; pos += (pos < ${angle}) ? 1 : -1) {\n  servo_${props.pin}.write(pos);\n  delay(15);\n}`;
      }
      return `servo_${props.pin}.write(${angle});`;
    },
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: "Servo (fil rouge)", to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Alimentation" },
    { from: "Servo (fil marron)", to: "GND", color: "black", label: "Masse" },
    { from: "Servo (fil orange)", to: `Pin ${props.pin}`, color: "orange", label: "Signal" },
  ],
  simulate: { defaultValue: 90, range: [0, 180], unit: "°", controlType: "slider" },
};
registerActivity(servo);
export default servo;

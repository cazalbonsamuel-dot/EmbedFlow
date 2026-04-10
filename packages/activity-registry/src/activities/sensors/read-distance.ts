import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const readDistance: ActivityDefinition = {
  id: "sensors.read_distance",
  category: "Capteurs",
  label: "Mesurer la distance",
  icon: "📏",
  description: "Mesure la distance avec un capteur ultrason HC-SR04",
  color: "#3b82f6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin_trigger", label: "Pin declencheur", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.digital", errorMessage: "Le declencheur a besoin d'un pin digital" } },
    { name: "pin_echo", label: "Pin echo", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.digital", errorMessage: "L'echo a besoin d'un pin digital" } },
    { name: "distance_max", label: "Distance max (cm)", type: "number", required: false, level: "options", default: 400 },
    { name: "unite", label: "Unite", type: "choice", required: false, level: "options", default: "cm",
      options: [{ label: "Centimetres", value: "cm" }, { label: "Pouces", value: "in" }] },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "distance", name: "Distance", type: "number" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: (props, ctx) => {
      const id = ctx?.nodeId?.replace(/-/g, "").slice(0, 8) ?? "0";
      return `#define TRIG_PIN_${id} ${props.pin_trigger}\n#define ECHO_PIN_${id} ${props.pin_echo}`;
    },
    setup: (props, ctx) => {
      const id = ctx?.nodeId?.replace(/-/g, "").slice(0, 8) ?? "0";
      return `pinMode(TRIG_PIN_${id}, OUTPUT);\npinMode(ECHO_PIN_${id}, INPUT);`;
    },
    loop: (props, _inputs, _outputs, ctx) => {
      const id = ctx?.nodeId?.replace(/-/g, "").slice(0, 8) ?? "0";
      const maxDist = props.distance_max as number || 400;
      const timeout = Math.round(maxDist * 58);
      // Use integer arithmetic (faster on AVR): distance_cm = duration_us / 58
      let code = `digitalWrite(TRIG_PIN_${id}, LOW);\ndelayMicroseconds(2);\ndigitalWrite(TRIG_PIN_${id}, HIGH);\ndelayMicroseconds(10);\ndigitalWrite(TRIG_PIN_${id}, LOW);\nunsigned long duree_${id} = pulseIn(ECHO_PIN_${id}, HIGH, ${timeout}UL);\nint distance_${id} = duree_${id} / 58;`;
      if (props.unite === "in") code += `\ndistance_${id} = distance_${id} * 100 / 254; // Conversion en pouces`;
      code += `\nif (distance_${id} <= 0 || distance_${id} > ${maxDist}) {\n  distance_${id} = -1; // Hors portee\n}`;
      return code;
    },
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin_trigger === undefined) messages.push("Veuillez selectionner le pin declencheur.");
    if (props.pin_echo === undefined) messages.push("Veuillez selectionner le pin echo.");
    if (props.pin_trigger !== undefined && props.pin_trigger === props.pin_echo) messages.push("Les pins declencheur et echo doivent etre differents.");
    if (props.pin_trigger !== undefined && ctx.usedPins.has(props.pin_trigger as number)) messages.push(`Le pin ${props.pin_trigger} est deja utilise.`);
    if (props.pin_echo !== undefined && ctx.usedPins.has(props.pin_echo as number)) messages.push(`Le pin ${props.pin_echo} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: "HC-SR04 VCC", to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Alimentation" },
    { from: "HC-SR04 GND", to: "GND", color: "black", label: "Masse" },
    { from: "HC-SR04 TRIG", to: `Pin ${props.pin_trigger}`, color: "yellow", label: "Declencheur" },
    { from: "HC-SR04 ECHO", to: `Pin ${props.pin_echo}`, color: "blue", label: "Echo" },
  ],
  simulate: { defaultValue: 25, range: [2, 400], unit: "cm", controlType: "slider" },
};
registerActivity(readDistance);
export default readDistance;

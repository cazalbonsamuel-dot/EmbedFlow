import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const varyIntensity: ActivityDefinition = {
  id: "gpio.vary_intensity",
  category: "Controle",
  label: "Varier l'intensite",
  icon: "🔆",
  description: "Fait varier l'intensite d'un composant (LED, moteur...)",
  color: "#f59e0b",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "composant", label: "Composant", type: "choice", required: true, level: "essential", default: "led",
      options: [{ label: "LED", value: "led" }, { label: "Lampe", value: "lampe" }, { label: "Ventilateur", value: "ventilateur" }] },
    { name: "pin", label: "Branche sur (PWM)", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.pwm", errorMessage: "Ce composant a besoin d'un pin PWM" } },
    { name: "intensite", label: "Intensite (%)", type: "slider", required: true, level: "essential", default: 50,
      validation: { rule: "range:0-100", errorMessage: "L'intensite doit etre entre 0 et 100%" } },
    { name: "progressif", label: "Variation progressive", type: "toggle", required: false, level: "options", default: false },
    { name: "duree_fade", label: "Duree du fondu (ms)", type: "number", required: false, level: "options", default: 1000 },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [], includes: [],
    globals: (props, ctx) => {
      if (!props.progressif) return "";
      const id = ctx?.nodeId?.replace(/-/g, "").slice(0, 8) ?? "0";
      return `int fadeVal_${id} = 0;\nunsigned long lastFade_${id} = 0;`;
    },
    setup: (props) => `pinMode(${props.pin}, OUTPUT);`,
    loop: (props, _inputs, _outputs, ctx) => {
      const pin = props.pin as number;
      const intensite = props.intensite as number || 50;
      const pwmVal = Math.round((intensite / 100) * 255);
      if (props.progressif) {
        const id = ctx?.nodeId?.replace(/-/g, "").slice(0, 8) ?? "0";
        const stepDelay = Math.max(1, Math.round((props.duree_fade as number || 1000) / 255));
        return [
          `// Fondu non-bloquant vers ${intensite}%`,
          `if (fadeVal_${id} != ${pwmVal} && millis() - lastFade_${id} >= ${stepDelay}UL) {`,
          `  fadeVal_${id} += (fadeVal_${id} < ${pwmVal}) ? 1 : -1;`,
          `  analogWrite(${pin}, fadeVal_${id});`,
          `  lastFade_${id} = millis();`,
          `}`,
        ].join("\n");
      }
      return `analogWrite(${pin}, ${pwmVal}); // ${intensite}%`;
    },
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin PWM.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: `${props.composant || "LED"} (+)`, to: `Pin ${props.pin}`, color: "orange", label: "Signal PWM" },
    { from: `${props.composant || "LED"} (-)`, to: "GND", color: "black", label: "Masse" },
    { from: "Resistance 220Ω", to: `Pin ${props.pin}`, color: "brown", label: `Protection (${board.id === "esp32" ? "3.3V" : "5V"})` },
  ],
  simulate: { defaultValue: 50, range: [0, 100], unit: "%", controlType: "slider" },
};
registerActivity(varyIntensity);
export default varyIntensity;

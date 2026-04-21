import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const readButton: ActivityDefinition = {
  id: "sensors.read_button",
  category: "Capteurs",
  label: "Detecter un appui bouton",
  icon: "🔘",
  description: "Detecte quand un bouton est appuye",
  color: "#3b82f6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin", label: "Branche sur", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.digital", errorMessage: "Le bouton a besoin d'un pin digital" } },
    { name: "type_appui", label: "Type d'appui", type: "choice", required: false, level: "options", default: "simple",
      options: [{ label: "Appui simple", value: "simple" }, { label: "Appui long", value: "long" }, { label: "Double appui", value: "double" }] },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "appuye", name: "Appuye", type: "boolean" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: (props) => `int lastButtonState_${props.pin} = HIGH;\nunsigned long lastDebounce_${props.pin} = 0;`,
    setup: (props) => `pinMode(${props.pin}, INPUT_PULLUP);`,
    loop: (props) => {
      const pin = props.pin as number;
      return `int reading_${pin} = digitalRead(${pin});\nbool appuye = false;\nif (reading_${pin} != lastButtonState_${pin}) {\n  lastDebounce_${pin} = millis();\n}\nif ((millis() - lastDebounce_${pin}) > 50) {\n  appuye = (reading_${pin} == LOW);\n}\nlastButtonState_${pin} = reading_${pin};`;
    },
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props) => [
    { from: "Bouton (branche 1)", to: `Pin ${props.pin}`, color: "blue", label: "Signal (pull-up interne)" },
    { from: "Bouton (branche 2)", to: "GND", color: "black", label: "Masse" },
  ],
  simulate: { defaultValue: false, controlType: "button" },
};
registerActivity(readButton);
export default readButton;

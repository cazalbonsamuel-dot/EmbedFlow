import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const noteFrequencies: Record<string, number> = {
  Do: 262, Re: 294, Mi: 330, Fa: 349, Sol: 392, La: 440, Si: 494, "Do+": 523,
};

const buzzer: ActivityDefinition = {
  id: "actuators.buzzer",
  category: "Actuateurs",
  label: "Jouer un son",
  icon: "🔊",
  description: "Produit un son avec un buzzer piezo",
  color: "#10b981",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin", label: "Branche sur", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.digital", errorMessage: "Le buzzer a besoin d'un pin digital" } },
    { name: "mode", label: "Mode", type: "choice", required: true, level: "essential", default: "note",
      options: [{ label: "Note musicale", value: "note" }, { label: "Frequence personnalisee", value: "freq" }] },
    { name: "note", label: "Note", type: "choice", required: false, level: "essential", default: "La",
      options: Object.keys(noteFrequencies).map((n) => ({ label: n, value: n })) },
    { name: "frequence", label: "Frequence (Hz)", type: "number", required: false, level: "essential", default: 440 },
    { name: "duree", label: "Duree (ms)", type: "number", required: true, level: "essential", default: 200 },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const pin = props.pin as number;
      const duree = props.duree as number || 200;
      let freq: number;
      if (props.mode === "note") {
        freq = noteFrequencies[props.note as string] || 440;
      } else {
        freq = props.frequence as number || 440;
      }
      return `tone(${pin}, ${freq}, ${duree});\ndelay(${duree + 50});\nnoTone(${pin});`;
    },
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props) => [
    { from: "Buzzer (+)", to: `Pin ${props.pin}`, color: "orange", label: "Signal" },
    { from: "Buzzer (-)", to: "GND", color: "black", label: "Masse" },
  ],
  simulate: { defaultValue: 440, range: [100, 2000], unit: "Hz", controlType: "slider" },
};
registerActivity(buzzer);
export default buzzer;

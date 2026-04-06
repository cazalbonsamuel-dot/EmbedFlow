import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const neopixel: ActivityDefinition = {
  id: "display.neopixel",
  category: "Affichage",
  label: "Allumer une LED RGB",
  icon: "🌈",
  description: "Controle une LED RGB NeoPixel (couleur, effet)",
  color: "#a855f7",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "pin", label: "Branche sur", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.digital", errorMessage: "Le NeoPixel a besoin d'un pin digital" } },
    { name: "nb_leds", label: "Nombre de LEDs", type: "number", required: true, level: "essential", default: 1 },
    { name: "led_index", label: "LED n°", type: "number", required: true, level: "essential", default: 0 },
    { name: "rouge", label: "Rouge (0-255)", type: "slider", required: true, level: "essential", default: 255,
      validation: { rule: "range:0-255", errorMessage: "La valeur doit etre entre 0 et 255" } },
    { name: "vert", label: "Vert (0-255)", type: "slider", required: true, level: "essential", default: 0,
      validation: { rule: "range:0-255", errorMessage: "La valeur doit etre entre 0 et 255" } },
    { name: "bleu", label: "Bleu (0-255)", type: "slider", required: true, level: "essential", default: 0,
      validation: { rule: "range:0-255", errorMessage: "La valeur doit etre entre 0 et 255" } },
    { name: "effet", label: "Effet", type: "choice", required: false, level: "options", default: "fixe",
      options: [{ label: "Fixe", value: "fixe" }, { label: "Clignotant", value: "clignotant" }, { label: "Fondu", value: "fondu" }] },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [{ name: "Adafruit NeoPixel", version: "^1.12" }],
    includes: ["Adafruit_NeoPixel.h"],
    globals: (props) => `Adafruit_NeoPixel strip(${props.nb_leds || 1}, ${props.pin}, NEO_GRB + NEO_KHZ800);`,
    setup: () => `strip.begin();\nstrip.setBrightness(50);\nstrip.show();`,
    loop: (props) => {
      const idx = props.led_index as number || 0;
      const r = props.rouge as number ?? 255;
      const g = props.vert as number ?? 0;
      const b = props.bleu as number ?? 0;
      return `strip.setPixelColor(${idx}, strip.Color(${r}, ${g}, ${b}));\nstrip.show();`;
    },
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    const idx = props.led_index as number || 0;
    const nb = props.nb_leds as number || 1;
    if (idx >= nb) messages.push(`La LED n°${idx} n'existe pas (vous avez ${nb} LEDs, de 0 a ${nb - 1}).`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: "NeoPixel VCC", to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Alimentation" },
    { from: "NeoPixel GND", to: "GND", color: "black", label: "Masse" },
    { from: "NeoPixel DIN", to: `Pin ${props.pin}`, color: "green", label: "Donnees" },
  ],
  simulate: { defaultValue: "#FF0000", controlType: "input" },
};
registerActivity(neopixel);
export default neopixel;

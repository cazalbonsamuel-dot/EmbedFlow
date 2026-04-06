import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const readHumidity: ActivityDefinition = {
  id: "sensors.read_humidity",
  category: "Capteurs",
  label: "Lire l'humidite",
  icon: "💧",
  description: "Mesure l'humidite relative avec un capteur DHT",
  color: "#3b82f6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "capteur", label: "Capteur", type: "choice", required: true, level: "essential", default: "DHT22",
      options: [{ label: "DHT11", value: "DHT11" }, { label: "DHT22", value: "DHT22" }] },
    { name: "pin", label: "Branche sur", type: "pin", required: true, level: "essential",
      validation: { rule: "pin.digital", errorMessage: "Ce capteur a besoin d'un pin digital" } },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "humidite", name: "Humidite", type: "number" },
  ],
  codegen: {
    libraries: [{ name: "DHT sensor library", version: "^1.4" }],
    includes: ["DHT.h"],
    globals: (props) => {
      const pin = props.pin as number || 4;
      const type = props.capteur as string || "DHT22";
      return `#define DHTPIN_H ${pin}\n#define DHTTYPE_H ${type}\nDHT dht_h(DHTPIN_H, DHTTYPE_H);`;
    },
    setup: () => "dht_h.begin();",
    loop: () => `float humidite = dht_h.readHumidity();\nif (isnan(humidite)) {\n  humidite = -1; // Erreur de lecture\n}`,
  },
  validate: (props, ctx) => {
    const messages: string[] = [];
    if (props.pin === undefined) messages.push("Veuillez selectionner un pin.");
    else if (ctx.usedPins.has(props.pin as number)) messages.push(`Le pin ${props.pin} est deja utilise.`);
    return { valid: messages.length === 0, messages };
  },
  wiring: (props, board) => [
    { from: `${props.capteur || "DHT22"} VCC`, to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Alimentation" },
    { from: `${props.capteur || "DHT22"} GND`, to: "GND", color: "black", label: "Masse" },
    { from: `${props.capteur || "DHT22"} DATA`, to: `Pin ${props.pin}`, color: "green", label: "Donnees" },
    { from: "Resistance 4.7kΩ", to: `${board.id === "esp32" ? "3.3V" : "5V"} <-> Pin ${props.pin}`, color: "brown", label: "Pull-up" },
  ],
  simulate: { defaultValue: 45, range: [0, 100], unit: "%", controlType: "slider" },
};
registerActivity(readHumidity);
export default readHumidity;

import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const wifiConnect: ActivityDefinition = {
  id: "communication.wifi_connect",
  category: "Communication",
  label: "Se connecter au WiFi",
  icon: "📶",
  description: "Connecte la carte au reseau WiFi (ESP32 uniquement)",
  color: "#f97316",
  supportedBoards: ["esp32", "esp8266"],
  properties: [
    { name: "ssid", label: "Nom du reseau", type: "text", required: true, level: "essential" },
    { name: "password", label: "Mot de passe", type: "text", required: true, level: "essential" },
    { name: "timeout", label: "Timeout (secondes)", type: "number", required: false, level: "options", default: 10 },
    { name: "auto_reconnect", label: "Reconnexion auto", type: "toggle", required: false, level: "options", default: true },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "connecte", name: "Connecte", type: "boolean" },
  ],
  codegen: {
    libraries: [], includes: ["WiFi.h"],
    globals: () => "",
    setup: (props) => {
      const timeout = (props.timeout as number || 10) * 1000;
      return `WiFi.begin("${props.ssid || ""}", "${props.password || ""}");\nunsigned long wifiStart = millis();\nwhile (WiFi.status() != WL_CONNECTED && millis() - wifiStart < ${timeout}) {\n  delay(500);\n}\nbool connecte = (WiFi.status() == WL_CONNECTED);`;
    },
    loop: (props) => {
      if (props.auto_reconnect) {
        return `if (WiFi.status() != WL_CONNECTED) {\n  WiFi.reconnect();\n  delay(1000);\n}`;
      }
      return `bool connecte = (WiFi.status() == WL_CONNECTED);`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.ssid) messages.push("Veuillez entrer le nom du reseau WiFi.");
    if (!props.password) messages.push("Veuillez entrer le mot de passe WiFi.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: true, controlType: "toggle" },
};
registerActivity(wifiConnect);
export default wifiConnect;

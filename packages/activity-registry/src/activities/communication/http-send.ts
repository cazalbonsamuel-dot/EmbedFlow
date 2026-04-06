import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const httpSend: ActivityDefinition = {
  id: "communication.http_send",
  category: "Communication",
  label: "Envoyer sur internet",
  icon: "🌐",
  description: "Envoie des donnees vers une URL (ESP32 uniquement)",
  color: "#f97316",
  supportedBoards: ["esp32", "esp8266"],
  properties: [
    { name: "url", label: "URL", type: "text", required: true, level: "essential",
      helpText: "L'adresse web (ex: https://mon-serveur.com/data)" },
    { name: "donnee", label: "Donnee a envoyer", type: "variable", required: true, level: "essential",
      helpText: "La variable a envoyer" },
    { name: "methode", label: "Methode", type: "choice", required: false, level: "options", default: "POST",
      options: [{ label: "POST", value: "POST" }, { label: "GET", value: "GET" }, { label: "PUT", value: "PUT" }] },
    { name: "frequence", label: "Frequence d'envoi (sec)", type: "number", required: false, level: "options", default: 30 },
    { name: "reessais", label: "Nb de reessais", type: "number", required: false, level: "options", default: 3 },
    { name: "content_type", label: "Content-Type", type: "choice", required: false, level: "expert", default: "json",
      options: [{ label: "JSON", value: "json" }, { label: "Form data", value: "form" }] },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "code_retour", name: "Code retour", type: "number" },
  ],
  codegen: {
    libraries: [], includes: ["HTTPClient.h"],
    globals: () => "HTTPClient http;",
    setup: () => "",
    loop: (props) => {
      const methode = props.methode as string || "POST";
      const ct = props.content_type === "form" ? "application/x-www-form-urlencoded" : "application/json";
      const donnee = props.donnee as string || "donnee";
      let body: string;
      if (props.content_type === "form") {
        body = `String("valeur=") + String(${donnee})`;
      } else {
        body = `String("{\\"valeur\\":") + String(${donnee}) + String("}")`;
      }
      return `http.begin("${props.url || ""}");\nhttp.addHeader("Content-Type", "${ct}");\nint code_retour = http.${methode}(${body});\nhttp.end();`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.url) messages.push("Veuillez entrer une URL.");
    if (!props.donnee) messages.push("Veuillez choisir une donnee a envoyer.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: 200, range: [100, 599], unit: "HTTP", controlType: "input" },
};
registerActivity(httpSend);
export default httpSend;

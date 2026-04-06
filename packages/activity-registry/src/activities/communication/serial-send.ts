import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const serialSend: ActivityDefinition = {
  id: "communication.serial_send",
  category: "Communication",
  label: "Envoyer sur le port serie",
  icon: "📤",
  description: "Envoie des donnees sur le port serie (moniteur)",
  color: "#f97316",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "donnee", label: "Donnee a envoyer", type: "text", required: true, level: "essential", default: "Bonjour",
      helpText: "Texte ou nom de variable a envoyer" },
    { name: "format", label: "Format", type: "choice", required: false, level: "options", default: "println",
      options: [{ label: "Avec retour a la ligne", value: "println" }, { label: "Sans retour a la ligne", value: "print" }] },
    { name: "baudrate", label: "Vitesse (baud)", type: "choice", required: false, level: "expert", default: "9600",
      options: [{ label: "9600", value: "9600" }, { label: "115200", value: "115200" }] },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: (props) => `Serial.begin(${props.baudrate || 9600});`,
    loop: (props) => {
      const fn = props.format === "print" ? "print" : "println";
      return `Serial.${fn}(${props.donnee || '""'});`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.donnee) messages.push("Veuillez entrer une donnee a envoyer.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: "Bonjour", controlType: "input" },
};
registerActivity(serialSend);
export default serialSend;

import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const assign: ActivityDefinition = {
  id: "variables.assign",
  category: "Variables",
  label: "Memoriser une valeur",
  icon: "📝",
  description: "Cree ou modifie une variable",
  color: "#ec4899",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "nom", label: "Nom de la variable", type: "text", required: true, level: "essential", default: "maVariable" },
    { name: "type_var", label: "Type", type: "choice", required: true, level: "essential", default: "float",
      options: [{ label: "Nombre decimal", value: "float" }, { label: "Nombre entier", value: "int" }, { label: "Texte", value: "String" }, { label: "Vrai/Faux", value: "bool" }] },
    { name: "valeur", label: "Valeur", type: "text", required: true, level: "essential", default: "0" },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [], includes: [],
    globals: (props) => `${props.type_var || "float"} ${props.nom || "maVariable"};`,
    setup: () => "",
    loop: (props) => `${props.nom || "maVariable"} = ${props.valeur || "0"};`,
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.nom) messages.push("Veuillez donner un nom a la variable.");
    if (props.nom && /\s/.test(props.nom as string)) messages.push("Le nom ne doit pas contenir d'espaces.");
    if (props.nom && /^\d/.test(props.nom as string)) messages.push("Le nom ne peut pas commencer par un chiffre.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: 0, controlType: "input" },
};
registerActivity(assign);
export default assign;

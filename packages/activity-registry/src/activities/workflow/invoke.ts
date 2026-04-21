import { registerActivity } from "../../core/registry.js";

registerActivity({
  id: "workflow.invoke",
  category: "Sous-programmes",
  label: "Appeler un sous-workflow",
  icon: "📎",
  description: "Appelle un sous-workflow reutilisable avec des arguments",
  color: "#0ea5e9",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],

  properties: [
    {
      name: "targetWorkflowId",
      label: "Sous-workflow cible",
      type: "text",
      required: true,
      level: "essential",
      helpText: "Selectionnez le sous-workflow a appeler",
    },
  ],

  inputs: [
    { id: "exec_in", name: "Entree", type: "execution" },
  ],

  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
  ],

  codegen: {
    libraries: [],
    includes: [],
    globals: () => "",
    setup: () => "",
    loop: () => "// workflow.invoke — handled by project codegen",
  },

  validate: (props) => {
    const messages: string[] = [];
    if (!props.targetWorkflowId) {
      messages.push("Aucun sous-workflow selectionne.");
    }
    return { valid: messages.length === 0, messages };
  },

  wiring: () => [],

  simulate: {
    defaultValue: 0,
    controlType: "input",
  },
});

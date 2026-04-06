import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const whileLoop: ActivityDefinition = {
  id: "logic.while_loop",
  category: "Logique",
  label: "Tant que...",
  icon: "🔁",
  description: "Repete des actions tant qu'une condition est vraie",
  color: "#8b5cf6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "variable", label: "Variable a tester", type: "variable", required: true, level: "essential" },
    { name: "operateur", label: "Condition", type: "choice", required: true, level: "essential", default: "<",
      options: [
        { label: "est superieure a", value: ">" }, { label: "est inferieure a", value: "<" },
        { label: "est egale a", value: "==" }, { label: "est differente de", value: "!=" },
        { label: "est superieure ou egale a", value: ">=" }, { label: "est inferieure ou egale a", value: "<=" },
      ] },
    { name: "valeur", label: "Valeur", type: "number", required: true, level: "essential", default: 0 },
    { name: "max_iterations", label: "Limite iterations (securite)", type: "number", required: false, level: "options", default: 1000,
      helpText: "Protection contre les boucles infinies" },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_body", name: "Faire (corps)", type: "execution" },
    { id: "exec_out", name: "Apres la boucle", type: "execution" },
  ],
  codegen: {
    libraries: [], includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const v = props.variable as string || "valeur";
      const op = props.operateur as string || "<";
      const val = props.valeur as number ?? 0;
      const max = props.max_iterations as number || 1000;
      return `int _iter = 0;\nwhile (${v} ${op} ${val} && _iter < ${max}) {\n  // Corps de la boucle\n  _iter++;\n}`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.variable) messages.push("Veuillez choisir une variable a tester.");
    return { valid: messages.length === 0, messages };
  },
  wiring: () => [],
  simulate: { defaultValue: true, controlType: "toggle" },
};
registerActivity(whileLoop);
export default whileLoop;

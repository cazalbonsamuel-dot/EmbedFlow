import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const ifThen: ActivityDefinition = {
  id: "logic.if_then",
  category: "Logique",
  label: "Si... alors... sinon...",
  icon: "🔀",
  description: "Execute des actions differentes selon une condition",
  color: "#8b5cf6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],

  properties: [
    {
      name: "variable",
      label: "Variable a tester",
      type: "variable",
      required: true,
      level: "essential",
      helpText: "La variable dont on veut tester la valeur",
    },
    {
      name: "operateur",
      label: "Condition",
      type: "choice",
      required: true,
      level: "essential",
      default: ">",
      options: [
        { label: "est superieure a", value: ">" },
        { label: "est inferieure a", value: "<" },
        { label: "est egale a", value: "==" },
        { label: "est differente de", value: "!=" },
        { label: "est superieure ou egale a", value: ">=" },
        { label: "est inferieure ou egale a", value: "<=" },
      ],
      helpText: "Le type de comparaison",
    },
    {
      name: "valeur",
      label: "Valeur",
      type: "number",
      required: true,
      level: "essential",
      default: 0,
      helpText: "La valeur de comparaison",
    },
  ],

  inputs: [
    { id: "exec_in", name: "Entree", type: "execution" },
    { id: "condition_value", name: "Valeur a tester", type: "number" },
  ],
  outputs: [
    { id: "exec_then", name: "Alors (vrai)", type: "execution" },
    { id: "exec_else", name: "Sinon (faux)", type: "execution" },
  ],

  codegen: {
    libraries: [],
    includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const variable = (props.variable as string) || "valeur";
      const operateur = (props.operateur as string) || ">";
      const valeur = props.valeur as number ?? 0;

      return [
        `if (${variable} ${operateur} ${valeur}) {`,
        `  // Bloc ALORS`,
        `} else {`,
        `  // Bloc SINON`,
        `}`,
      ].join("\n");
    },
  },

  validate: (props) => {
    const messages: string[] = [];
    const variable = props.variable as string | undefined;

    if (!variable || !variable.trim()) {
      messages.push("Veuillez choisir une variable a tester.");
    }

    const operateur = props.operateur as string | undefined;
    if (!operateur) {
      messages.push("Veuillez choisir un operateur de comparaison.");
    }

    return { valid: messages.length === 0, messages };
  },

  wiring: () => [],

  simulate: {
    defaultValue: true,
    controlType: "toggle",
  },
};

registerActivity(ifThen);
export default ifThen;

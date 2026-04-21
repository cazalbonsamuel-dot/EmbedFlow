import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const wait: ActivityDefinition = {
  id: "timing.wait",
  category: "Temps",
  label: "Attendre",
  icon: "⏱️",
  description: "Met en pause le programme pendant une duree donnee",
  color: "#06b6d4",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],

  properties: [
    {
      name: "duree",
      label: "Duree",
      type: "number",
      required: true,
      level: "essential",
      default: 1000,
      validation: {
        rule: "range:1-3600000",
        errorMessage: "La duree doit etre entre 1 ms et 1 heure",
      },
      helpText: "La duree d'attente",
    },
    {
      name: "unite",
      label: "Unite",
      type: "choice",
      required: true,
      level: "essential",
      default: "ms",
      options: [
        { label: "Millisecondes", value: "ms" },
        { label: "Secondes", value: "sec" },
        { label: "Minutes", value: "min" },
      ],
      helpText: "L'unite de temps",
    },
  ],

  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],

  codegen: {
    libraries: [],
    includes: [],
    globals: () => "",
    setup: () => "",
    loop: (props) => {
      const duree = (props.duree as number) || 1000;
      const unite = (props.unite as string) || "ms";

      let ms = duree;
      if (unite === "sec") ms = duree * 1000;
      if (unite === "min") ms = duree * 60000;

      return `delay(${ms});`;
    },
  },

  validate: (props) => {
    const messages: string[] = [];
    const duree = props.duree as number | undefined;

    if (duree === undefined || duree === null || duree <= 0) {
      messages.push("Veuillez entrer une duree valide (superieure a 0).");
    }

    if (duree && duree > 60000) {
      messages.push(
        "Attention : une attente de plus d'une minute peut bloquer le programme. Considerez 'Toutes les X secondes' a la place.",
      );
    }

    return { valid: messages.filter((m) => !m.startsWith("Attention")).length === 0, messages };
  },

  wiring: () => [],

  simulate: {
    defaultValue: 1000,
    range: [0, 10000],
    unit: "ms",
    controlType: "slider",
  },
};

registerActivity(wait);
export default wait;

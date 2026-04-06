import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const turnOff: ActivityDefinition = {
  id: "gpio.turn_off",
  category: "Controle",
  label: "Eteindre",
  icon: "⚫",
  description: "Eteint un composant (LED, lampe, ventilateur...)",
  color: "#f59e0b",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],

  properties: [
    {
      name: "composant",
      label: "Composant",
      type: "choice",
      required: true,
      level: "essential",
      default: "led",
      options: [
        { label: "LED", value: "led", icon: "💡" },
        { label: "Lampe", value: "lampe", icon: "🔆" },
        { label: "Ventilateur", value: "ventilateur", icon: "🌀" },
      ],
      helpText: "Le type de composant a eteindre",
    },
    {
      name: "pin",
      label: "Branche sur",
      type: "pin",
      required: true,
      level: "essential",
      validation: {
        rule: "pin.digital",
        errorMessage: "Ce composant a besoin d'un pin digital",
      },
      helpText: "Le pin sur lequel le composant est branche",
    },
    {
      name: "logique_inversee",
      label: "Logique inversee",
      type: "toggle",
      required: false,
      level: "expert",
      default: false,
      helpText: "Inverser le niveau logique (HIGH = eteint)",
    },
  ],

  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],

  codegen: {
    libraries: [],
    includes: [],
    globals: () => "",
    setup: (props) => {
      const pin = props.pin as number;
      return `pinMode(${pin}, OUTPUT);`;
    },
    loop: (props) => {
      const pin = props.pin as number;
      const inverted = props.logique_inversee as boolean;
      return `digitalWrite(${pin}, ${inverted ? "HIGH" : "LOW"});`;
    },
  },

  validate: (props, context) => {
    const messages: string[] = [];
    const pin = props.pin as number | undefined;

    if (pin === undefined || pin === null) {
      messages.push("Veuillez selectionner un pin.");
    } else if (context.usedPins.has(pin)) {
      messages.push(`Le pin ${pin} est deja utilise par un autre bloc.`);
    }

    return { valid: messages.length === 0, messages };
  },

  wiring: (props, board) => {
    const pin = props.pin as number;
    const composant = (props.composant as string) || "LED";
    const voltage = board.id === "esp32" ? "3.3V" : "5V";

    return [
      { from: `${composant} (+)`, to: `Pin ${pin}`, color: "orange", label: "Signal" },
      { from: `${composant} (-)`, to: "GND", color: "black", label: "Masse" },
      { from: `Resistance 220Ω`, to: `Pin ${pin}`, color: "brown", label: `Protection (vers ${voltage})` },
    ];
  },

  simulate: {
    defaultValue: false,
    controlType: "toggle",
  },
};

registerActivity(turnOff);
export default turnOff;

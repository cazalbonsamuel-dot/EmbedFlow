import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const lcd: ActivityDefinition = {
  id: "display.lcd",
  category: "Affichage",
  label: "Ecrire sur l'ecran LCD",
  icon: "📟",
  description: "Affiche du texte sur un ecran LCD I2C 16x2",
  color: "#a855f7",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "texte", label: "Texte", type: "text", required: true, level: "essential", default: "Bonjour !",
      helpText: "Utilisez {variable} pour inserer une variable" },
    { name: "ligne", label: "Ligne", type: "choice", required: true, level: "essential", default: "0",
      options: [{ label: "Ligne 1 (haut)", value: "0" }, { label: "Ligne 2 (bas)", value: "1" }] },
    { name: "effacer", label: "Effacer avant d'ecrire", type: "toggle", required: false, level: "options", default: true },
    { name: "adresse", label: "Adresse I2C", type: "number", required: false, level: "expert", default: 39,
      helpText: "Adresse I2C du LCD (0x27 = 39 par defaut)" },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [{ name: "LiquidCrystal I2C", version: "^1.1" }],
    includes: ["LiquidCrystal_I2C.h"],
    globals: (props, ctx) => {
      const id = ctx?.nodeId?.replace(/-/g, "").slice(0, 8) ?? "0";
      const addr = `0x${(props.adresse as number || 39).toString(16)}`;
      return `LiquidCrystal_I2C lcd_${id}(${addr}, 16, 2);\nchar lastLcd_${id}[17] = "";`;
    },
    setup: (_props, ctx) => {
      const id = ctx?.nodeId?.replace(/-/g, "").slice(0, 8) ?? "0";
      return `lcd_${id}.init();\nlcd_${id}.backlight();`;
    },
    loop: (props, _inputs, _outputs, ctx) => {
      const id = ctx?.nodeId?.replace(/-/g, "").slice(0, 8) ?? "0";
      const ligne = props.ligne as string || "0";
      const texte = (props.texte as string || "").replace(/"/g, '\\"');
      // Anti-flicker: only update display when text actually changes
      return [
        `if (strcmp(lastLcd_${id}, "${texte}") != 0) {`,
        `  strncpy(lastLcd_${id}, "${texte}", 16);`,
        `  lcd_${id}.setCursor(0, ${ligne});`,
        props.effacer !== false ? `  lcd_${id}.clear();` : null,
        `  lcd_${id}.print("${texte}");`,
        `}`,
      ].filter(Boolean).join("\n");
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.texte) messages.push("Veuillez entrer un texte a afficher.");
    if ((props.texte as string)?.length > 16) messages.push("Le texte depasse 16 caracteres (largeur de l'ecran).");
    return { valid: messages.length === 0, messages };
  },
  wiring: (_props, board) => {
    const sda = board.id === "esp32" ? "GPIO21" : "A4";
    const scl = board.id === "esp32" ? "GPIO22" : "A5";
    return [
      { from: "LCD I2C VCC", to: board.id === "esp32" ? "3.3V" : "5V", color: "red", label: "Alimentation" },
      { from: "LCD I2C GND", to: "GND", color: "black", label: "Masse" },
      { from: "LCD I2C SDA", to: sda, color: "blue", label: "Donnees I2C" },
      { from: "LCD I2C SCL", to: scl, color: "yellow", label: "Horloge I2C" },
    ];
  },
  simulate: { defaultValue: "Bonjour !", controlType: "input" },
};
registerActivity(lcd);
export default lcd;

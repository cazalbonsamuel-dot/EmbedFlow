import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

const oled: ActivityDefinition = {
  id: "display.oled",
  category: "Affichage",
  label: "Ecrire sur l'ecran OLED",
  icon: "🖥️",
  description: "Affiche du texte sur un ecran OLED SSD1306 I2C",
  color: "#a855f7",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],
  properties: [
    { name: "texte", label: "Texte", type: "text", required: true, level: "essential", default: "Bonjour !",
      helpText: "Utilisez {variable} pour inserer une variable" },
    { name: "position", label: "Position", type: "choice", required: true, level: "essential", default: "haut",
      options: [{ label: "Haut", value: "haut" }, { label: "Milieu", value: "milieu" }, { label: "Bas", value: "bas" }] },
    { name: "taille", label: "Taille du texte", type: "choice", required: false, level: "options", default: "1",
      options: [{ label: "Petit", value: "1" }, { label: "Moyen", value: "2" }, { label: "Grand", value: "3" }] },
  ],
  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [{ id: "exec_out", name: "Sortie", type: "execution" }],
  codegen: {
    libraries: [{ name: "Adafruit SSD1306", version: "^2.5" }, { name: "Adafruit GFX Library", version: "^1.11" }],
    includes: ["Adafruit_SSD1306.h"],
    globals: () => `#define SCREEN_WIDTH 128\n#define SCREEN_HEIGHT 64\nAdafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);`,
    setup: () => `if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {\n  // Ecran OLED non detecte\n}\ndisplay.clearDisplay();\ndisplay.setTextColor(SSD1306_WHITE);`,
    loop: (props) => {
      const posY: Record<string, number> = { haut: 0, milieu: 24, bas: 48 };
      const y = posY[props.position as string] ?? 0;
      const taille = props.taille as string || "1";
      return `display.clearDisplay();\ndisplay.setTextSize(${taille});\ndisplay.setCursor(0, ${y});\ndisplay.println("${props.texte || ""}");\ndisplay.display();`;
    },
  },
  validate: (props) => {
    const messages: string[] = [];
    if (!props.texte) messages.push("Veuillez entrer un texte a afficher.");
    return { valid: messages.length === 0, messages };
  },
  wiring: (_props, board) => {
    const sda = board.id === "esp32" ? "GPIO21" : "A4";
    const scl = board.id === "esp32" ? "GPIO22" : "A5";
    return [
      { from: "OLED VCC", to: "3.3V", color: "red", label: "Alimentation" },
      { from: "OLED GND", to: "GND", color: "black", label: "Masse" },
      { from: "OLED SDA", to: sda, color: "blue", label: "Donnees I2C" },
      { from: "OLED SCL", to: scl, color: "yellow", label: "Horloge I2C" },
    ];
  },
  simulate: { defaultValue: "Bonjour !", controlType: "input" },
};
registerActivity(oled);
export default oled;

import { registerActivity } from "../../core/registry.js";
import type { ActivityDefinition } from "../../core/types.js";

import type { LibraryDep } from "../../core/types.js";

const sensorConfigs: Record<string, {
  libraries: LibraryDep[];
  includes: string[];
  globalDecl: (pin: number) => string;
  setupCode: () => string;
  readCode: (varName: string) => string;
}> = {
  DHT11: {
    libraries: [{ name: "DHT sensor library", version: "^1.4" }],
    includes: ["DHT.h"],
    globalDecl: (pin) => `#define DHTPIN ${pin}\n#define DHTTYPE DHT11\nDHT dht(DHTPIN, DHTTYPE);`,
    setupCode: () => "dht.begin();",
    readCode: (v) => `float ${v} = dht.readTemperature();`,
  },
  DHT22: {
    libraries: [{ name: "DHT sensor library", version: "^1.4" }],
    includes: ["DHT.h"],
    globalDecl: (pin) => `#define DHTPIN ${pin}\n#define DHTTYPE DHT22\nDHT dht(DHTPIN, DHTTYPE);`,
    setupCode: () => "dht.begin();",
    readCode: (v) => `float ${v} = dht.readTemperature();`,
  },
  BMP280: {
    libraries: [{ name: "Adafruit BMP280 Library", version: "^2.6" }],
    includes: ["Adafruit_BMP280.h"],
    globalDecl: () => "Adafruit_BMP280 bmp;",
    setupCode: () => `if (!bmp.begin(0x76)) {\n    // Capteur BMP280 non detecte\n  }`,
    readCode: (v) => `float ${v} = bmp.readTemperature();`,
  },
  DS18B20: {
    libraries: [
      { name: "OneWire", version: "^2.3" },
      { name: "DallasTemperature", version: "^3.9" },
    ],
    includes: ["OneWire.h", "DallasTemperature.h"],
    globalDecl: (pin) => `OneWire oneWire(${pin});\nDallasTemperature dallas(&oneWire);`,
    setupCode: () => "dallas.begin();",
    readCode: (v) => `dallas.requestTemperatures();\nfloat ${v} = dallas.getTempCByIndex(0);`,
  },
};

const readTemperature: ActivityDefinition = {
  id: "sensors.read_temperature",
  category: "Capteurs",
  label: "Lire la temperature",
  icon: "🌡️",
  description: "Mesure la temperature ambiante avec un capteur",
  color: "#3b82f6",
  supportedBoards: ["arduino-uno", "arduino-nano", "arduino-mega", "esp32", "esp8266"],

  properties: [
    {
      name: "capteur",
      label: "Capteur",
      type: "choice",
      required: true,
      level: "essential",
      default: "DHT22",
      options: [
        { label: "DHT11", value: "DHT11", icon: "🌡️" },
        { label: "DHT22", value: "DHT22", icon: "🌡️" },
        { label: "BMP280", value: "BMP280", icon: "🌡️" },
        { label: "DS18B20", value: "DS18B20", icon: "🌡️" },
      ],
      helpText: "Le type de capteur de temperature utilise",
    },
    {
      name: "pin",
      label: "Branche sur",
      type: "pin",
      required: true,
      level: "essential",
      validation: {
        rule: "pin.digital",
        errorMessage: "Ce capteur a besoin d'un pin digital",
      },
      helpText: "Le pin de donnees du capteur (sauf BMP280 qui utilise I2C)",
    },
    {
      name: "unite",
      label: "Unite",
      type: "choice",
      required: false,
      level: "options",
      default: "C",
      options: [
        { label: "°C (Celsius)", value: "C" },
        { label: "°F (Fahrenheit)", value: "F" },
      ],
      helpText: "L'unite de mesure de la temperature",
    },
  ],

  inputs: [{ id: "exec_in", name: "Entree", type: "execution" }],
  outputs: [
    { id: "exec_out", name: "Sortie", type: "execution" },
    { id: "temperature", name: "Temperature", type: "number" },
  ],

  codegen: {
    libraries: (props) => sensorConfigs[(props.capteur as string) || "DHT22"]?.libraries ?? [],
    includes: (props) => sensorConfigs[(props.capteur as string) || "DHT22"]?.includes ?? [],

    globals: (props) => {
      const capteur = (props.capteur as string) || "DHT22";
      const pin = (props.pin as number) || 4;
      const config = sensorConfigs[capteur];
      if (!config) return "";
      return config.globalDecl(pin);
    },

    setup: (props) => {
      const capteur = (props.capteur as string) || "DHT22";
      const config = sensorConfigs[capteur];
      if (!config) return "";
      return config.setupCode();
    },

    loop: (props) => {
      const capteur = (props.capteur as string) || "DHT22";
      const unite = (props.unite as string) || "C";
      const config = sensorConfigs[capteur];
      if (!config) return "";

      let code = config.readCode("temperature");

      // NaN check for DHT sensors
      if (capteur === "DHT11" || capteur === "DHT22") {
        code += `\nif (isnan(temperature)) {\n  temperature = -999; // Erreur de lecture\n}`;
      }

      // DS18B20 error check
      if (capteur === "DS18B20") {
        code += `\nif (temperature == -127.0) {\n  temperature = -999; // Erreur de lecture\n}`;
      }

      // Fahrenheit conversion
      if (unite === "F") {
        code += `\ntemperature = temperature * 1.8 + 32; // Conversion en Fahrenheit`;
      }

      return code;
    },

    errorHandling: (props) => {
      const capteur = (props.capteur as string) || "DHT22";
      if (capteur === "DHT11" || capteur === "DHT22") {
        return "// Verifier que le capteur repond (isnan)";
      }
      return "";
    },
  },

  validate: (props, context) => {
    const messages: string[] = [];
    const pin = props.pin as number | undefined;
    const capteur = (props.capteur as string) || "DHT22";

    if (!capteur) {
      messages.push("Veuillez choisir un type de capteur.");
    }

    if (pin === undefined || pin === null) {
      messages.push("Veuillez selectionner un pin.");
    } else {
      if (context.usedPins.has(pin)) {
        messages.push(`Le pin ${pin} est deja utilise par un autre bloc.`);
      }
      // BMP280 uses I2C, no pin needed (uses A4/A5 or GPIO21/22)
      if (capteur === "BMP280") {
        messages.push("Le BMP280 utilise le bus I2C (pins SDA/SCL). Le pin selectionne sera ignore.");
      }
    }

    return { valid: messages.filter((m) => !m.includes("ignore")).length === 0, messages };
  },

  wiring: (props, board) => {
    const pin = props.pin as number;
    const capteur = (props.capteur as string) || "DHT22";
    const voltage = board.id === "esp32" ? "3.3V" : "5V";

    if (capteur === "BMP280") {
      const sda = board.id === "esp32" ? "GPIO21" : "A4";
      const scl = board.id === "esp32" ? "GPIO22" : "A5";
      return [
        { from: "BMP280 VCC", to: voltage, color: "red", label: "Alimentation" },
        { from: "BMP280 GND", to: "GND", color: "black", label: "Masse" },
        { from: "BMP280 SDA", to: sda, color: "blue", label: "Donnees I2C" },
        { from: "BMP280 SCL", to: scl, color: "yellow", label: "Horloge I2C" },
      ];
    }

    const instructions = [
      { from: `${capteur} VCC`, to: voltage, color: "red", label: "Alimentation" },
      { from: `${capteur} GND`, to: "GND", color: "black", label: "Masse" },
      { from: `${capteur} DATA`, to: `Pin ${pin}`, color: "green", label: "Donnees" },
    ];

    // DHT sensors need a pull-up resistor
    if (capteur === "DHT11" || capteur === "DHT22") {
      instructions.push({
        from: "Resistance 4.7kΩ",
        to: `${voltage} <-> Pin ${pin}`,
        color: "brown",
        label: "Pull-up",
      });
    }

    return instructions;
  },

  simulate: {
    defaultValue: 22.5,
    range: [-40, 80],
    unit: "°C",
    controlType: "slider",
  },
};

registerActivity(readTemperature);
export default readTemperature;

// Core types
export type {
  PropertyOption,
  PropertyValidation,
  PropertyDef,
  PortDef,
  LibraryDep,
  WiringInstruction,
  SimulateConfig,
  CodegenConfig,
  ActivityDefinition,
} from "./core/types.js";

// Registry functions
export {
  registerActivity,
  getActivity,
  listActivities,
  listByCategory,
  getCategories,
  validateCompatibility,
} from "./core/registry.js";

// Activities — side-effect imports to trigger self-registration

// GPIO
import "./activities/gpio/turn-on.js";
import "./activities/gpio/turn-off.js";
import "./activities/gpio/vary-intensity.js";

// Capteurs
import "./activities/sensors/read-temperature.js";
import "./activities/sensors/read-humidity.js";
import "./activities/sensors/read-distance.js";
import "./activities/sensors/detect-motion.js";
import "./activities/sensors/read-light.js";
import "./activities/sensors/read-button.js";
import "./activities/sensors/read-potentiometer.js";

// Actuateurs
import "./activities/actuators/servo.js";
import "./activities/actuators/motor.js";
import "./activities/actuators/relay.js";
import "./activities/actuators/buzzer.js";

// Affichage
import "./activities/display/lcd.js";
import "./activities/display/oled.js";
import "./activities/display/neopixel.js";

// Logique
import "./activities/logic/if-then.js";
import "./activities/logic/while-loop.js";
import "./activities/logic/repeat.js";
import "./activities/logic/switch-case.js";

// Temps
import "./activities/timing/wait.js";
import "./activities/timing/interval.js";

// Communication
import "./activities/communication/serial-send.js";
import "./activities/communication/wifi-connect.js";
import "./activities/communication/http-send.js";

// Variables
import "./activities/variables/assign.js";
import "./activities/variables/calculate.js";
import "./activities/variables/compare.js";
import "./activities/variables/constrain.js";
import "./activities/variables/map-range.js";

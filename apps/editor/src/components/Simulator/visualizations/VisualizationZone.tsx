import { useTranslation } from "react-i18next";
import { useSimulationStore } from "../../../stores/simulation-store";
import VirtualLed from "./VirtualLed";
import VirtualServo from "./VirtualServo";
import VirtualLcd from "./VirtualLcd";
import VirtualBuzzer from "./VirtualBuzzer";

export default function VisualizationZone() {
  const { t } = useTranslation();
  const leds = useSimulationStore((s) => s.leds);
  const servos = useSimulationStore((s) => s.servos);
  const buzzers = useSimulationStore((s) => s.buzzers);
  const lcd = useSimulationStore((s) => s.lcd);

  const ledEntries = Object.values(leds);
  const servoEntries = Object.values(servos);
  const buzzerEntries = Object.values(buzzers);
  const hasLcd = lcd.lines[0] !== "" || lcd.lines[1] !== "";

  const hasAnything = ledEntries.length > 0 || servoEntries.length > 0 || buzzerEntries.length > 0 || hasLcd;

  if (!hasAnything) {
    return (
      <div className="px-3 py-4 text-center text-xs text-gray-600">
        {t("simulator.noOutputs")}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 space-y-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("simulator.outputs")}</p>

      {/* LEDs */}
      {ledEntries.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {ledEntries.map((led) => (
            <VirtualLed key={led.pin} {...led} />
          ))}
        </div>
      )}

      {/* Servos */}
      {servoEntries.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {servoEntries.map((servo) => (
            <VirtualServo key={servo.pin} {...servo} />
          ))}
        </div>
      )}

      {/* Buzzers */}
      {buzzerEntries.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {buzzerEntries.map((buzzer) => (
            <VirtualBuzzer key={buzzer.pin} {...buzzer} />
          ))}
        </div>
      )}

      {/* LCD */}
      {hasLcd && <VirtualLcd {...lcd} />}
    </div>
  );
}

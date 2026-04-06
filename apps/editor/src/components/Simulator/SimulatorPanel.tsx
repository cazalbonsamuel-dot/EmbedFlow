import { useTranslation } from "react-i18next";
import SimulatorToolbar from "./SimulatorToolbar";
import SensorControls from "./controls/SensorControls";
import VisualizationZone from "./visualizations/VisualizationZone";
import SerialConsole from "./SerialConsole";

export default function SimulatorPanel() {
  const { t } = useTranslation();

  return (
    <aside className="w-96 border-l border-gray-800 bg-gray-900/30 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">{t("simulator.title")}</h2>
      </div>

      {/* Toolbar */}
      <SimulatorToolbar />

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto min-h-0">
        {/* Sensor controls */}
        <div className="border-b border-gray-800">
          <SensorControls />
        </div>

        {/* Visualizations */}
        <div className="border-b border-gray-800">
          <VisualizationZone />
        </div>
      </div>

      {/* Serial console — fixed at bottom */}
      <SerialConsole />
    </aside>
  );
}

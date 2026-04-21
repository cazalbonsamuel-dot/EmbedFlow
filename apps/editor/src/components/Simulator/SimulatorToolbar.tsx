import { useTranslation } from "react-i18next";
import { useSimulationStore } from "../../stores/simulation-store";

const speeds = [1, 10, 100] as const;

export default function SimulatorToolbar() {
  const { t } = useTranslation();
  const status = useSimulationStore((s) => s.simulationStatus);
  const speed = useSimulationStore((s) => s.speedMultiplier);
  const loopCount = useSimulationStore((s) => s.loopCount);
  const errorMessage = useSimulationStore((s) => s.errorMessage);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const start = useSimulationStore((s) => s.startSimulation);
  const pause = useSimulationStore((s) => s.pauseSimulation);
  const resume = useSimulationStore((s) => s.resumeSimulation);
  const step = useSimulationStore((s) => s.stepSimulation);
  const reset = useSimulationStore((s) => s.resetSimulation);

  const isRunning = status === "running";
  const isPaused = status === "paused" || status === "stepping";
  const isIdle = status === "idle";

  const statusBadge = () => {
    switch (status) {
      case "idle":
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-700 text-gray-400">{t("simulator.ready")}</span>;
      case "running":
      case "finished":
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-900/50 text-green-400">{t("simulator.success")}</span>;
      case "paused":
      case "stepping":
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-yellow-900/50 text-yellow-400">{t("simulator.paused")}</span>;
      case "error":
        return (
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-900/50 text-red-400 max-w-[200px] truncate" title={errorMessage || ""}>
            {errorMessage || t("simulator.error")}
          </span>
        );
    }
  };

  return (
    <div className="px-3 py-2 border-b border-gray-800 space-y-2">
      {/* Controls */}
      <div className="flex items-center gap-1">
        {isIdle || status === "error" || status === "finished" ? (
          <button onClick={start} className="px-2 py-1 text-xs rounded bg-green-700 hover:bg-green-600 text-white transition-colors" title={t("simulator.play")}>
            &#9654;
          </button>
        ) : isRunning ? (
          <button onClick={pause} className="px-2 py-1 text-xs rounded bg-yellow-700 hover:bg-yellow-600 text-white transition-colors" title={t("simulator.pause")}>
            &#9646;&#9646;
          </button>
        ) : (
          <button onClick={resume} className="px-2 py-1 text-xs rounded bg-green-700 hover:bg-green-600 text-white transition-colors" title={t("simulator.play")}>
            &#9654;
          </button>
        )}

        <button
          onClick={step}
          disabled={isRunning}
          className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={t("simulator.step")}
        >
          &#9654;|
        </button>

        <button
          onClick={reset}
          disabled={isIdle}
          className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={t("simulator.reset")}
        >
          &#9632;
        </button>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        {/* Speed selector */}
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
              speed === s
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            x{s}
          </button>
        ))}
      </div>

      {/* Status + loop counter */}
      <div className="flex items-center justify-between">
        {statusBadge()}
        {loopCount > 0 && (
          <span className="text-[10px] text-gray-500">
            {t("simulator.loop")} {loopCount}
          </span>
        )}
      </div>
    </div>
  );
}

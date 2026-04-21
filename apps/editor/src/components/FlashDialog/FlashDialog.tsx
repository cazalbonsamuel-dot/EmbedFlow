import { useFlashStore } from "../../stores/flash-store";
import { useWorkflowStore } from "../../stores/workflow-store";

const STAGE_LABELS: Record<string, string> = {
  preparing: "Préparation...",
  connecting: "Connexion à la carte...",
  writing: "Écriture...",
  verifying: "Vérification...",
  done: "Terminé !",
  error: "Erreur",
};

const STAGE_ICONS: Record<string, string> = {
  preparing: "⚙️",
  connecting: "🔗",
  writing: "✍️",
  verifying: "🔍",
  done: "✅",
  error: "❌",
};

export default function FlashDialog() {
  const {
    showDialog,
    closeDialog,
    status,
    progress,
    connectedPorts,
    selectedPort,
    errorMessage,
    selectPort,
    flash,
    detectBoards,
    reset,
  } = useFlashStore();

  const boardId = useWorkflowStore((s) => s.boardId);

  if (!showDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <h2 className="text-base font-semibold text-gray-100">Envoyer sur la carte</h2>
          </div>
          <button
            onClick={closeDialog}
            disabled={status === "flashing"}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none disabled:opacity-30"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Board info */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>🎛️</span>
            <span>Cible :</span>
            <span className="text-gray-200 font-medium">{boardId}</span>
          </div>

          {/* Port detection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Port série
              </span>
              <button
                onClick={detectBoards}
                disabled={status === "detecting" || status === "flashing"}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40"
              >
                {status === "detecting" ? "Détection..." : "↻ Actualiser"}
              </button>
            </div>

            {status === "detecting" ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-800/60 text-sm text-gray-400">
                <span className="animate-spin">⏳</span>
                <span>Recherche des cartes connectées...</span>
              </div>
            ) : connectedPorts.length === 0 ? (
              <div className="p-3 rounded-lg bg-yellow-950/30 border border-yellow-800/50 text-sm text-yellow-300">
                Aucune carte détectée. Branchez votre carte et actualisez.
              </div>
            ) : (
              <div className="space-y-2">
                {connectedPorts.map((p) => (
                  <button
                    key={p.port}
                    onClick={() => selectPort(p.port)}
                    disabled={status === "flashing"}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      selectedPort === p.port
                        ? "border-blue-600 bg-blue-950/40 text-blue-300"
                        : "border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{selectedPort === p.port ? "●" : "○"}</span>
                      <span className="font-mono text-xs">{p.port}</span>
                    </div>
                    <span className="text-xs text-gray-500">{p.boardName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Flash progress */}
          {(status === "flashing" || status === "success" || status === "error") && progress && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span>{STAGE_ICONS[progress.stage] ?? "⚙️"}</span>
                <span className={`font-medium ${
                  progress.stage === "done" ? "text-green-400"
                    : progress.stage === "error" ? "text-red-400"
                    : "text-gray-200"
                }`}>
                  {STAGE_LABELS[progress.stage] ?? progress.stage}
                </span>
              </div>

              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress.stage === "error" ? "bg-red-500"
                      : progress.stage === "done" ? "bg-green-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {progress.message && (
                <p className="text-xs text-gray-500 font-mono">{progress.message}</p>
              )}
            </div>
          )}

          {/* Error message */}
          {status === "error" && errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="p-3 rounded-lg bg-green-950/30 border border-green-800/50 text-sm text-green-300 flex items-center gap-2">
              <span>✅</span>
              <span>Code envoyé avec succès ! La carte redémarre.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
          {(status === "success" || status === "error") && (
            <button
              onClick={reset}
              className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Réessayer
            </button>
          )}

          {status !== "flashing" && status !== "success" && (
            <button
              onClick={closeDialog}
              className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Annuler
            </button>
          )}

          {(status === "idle" || status === "ready" || status === "detecting") && (
            <button
              onClick={flash}
              disabled={!selectedPort || status === "detecting"}
              className="px-5 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ⚡ Envoyer
            </button>
          )}

          {status === "success" && (
            <button
              onClick={closeDialog}
              className="px-5 py-2 text-sm rounded-lg bg-green-700 hover:bg-green-600 text-white font-medium transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

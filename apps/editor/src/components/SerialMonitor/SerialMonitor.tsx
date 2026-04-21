import { useEffect, useRef, useState } from "react";
import { useSerialStore } from "../../stores/serial-store";
import { useFlashStore } from "../../stores/flash-store";
import SerialGraph from "./SerialGraph";

const BAUD_RATES = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 250000];

export default function SerialMonitor() {
  const {
    status,
    lines,
    portPath,
    baudRate,
    graphMode,
    graphData,
    connect,
    disconnect,
    send,
    clear,
    toggleGraphMode,
    setPortPath,
    setBaudRate,
  } = useSerialStore();

  const connectedPorts = useFlashStore((s) => s.connectedPorts);
  const detectBoards = useFlashStore((s) => s.detectBoards);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Refresh port list on mount
  useEffect(() => {
    detectBoards();
  }, [detectBoards]);

  const handleConnect = () => {
    const fqbn = connectedPorts.find((p) => p.port === portPath)?.fqbn ?? "";
    connect(portPath, baudRate, fqbn);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    send(input);
    setInput("");
  };

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const statusColor = {
    disconnected: "text-gray-500",
    connecting: "text-yellow-400",
    connected: "text-green-400",
    error: "text-red-400",
  }[status];

  const statusLabel = {
    disconnected: "Déconnecté",
    connecting: "Connexion...",
    connected: "Connecté",
    error: "Erreur",
  }[status];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 shrink-0 flex-wrap">
        {/* Port selector */}
        <select
          value={portPath}
          onChange={(e) => setPortPath(e.target.value)}
          disabled={isConnected || isConnecting}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-50 max-w-[140px]"
        >
          <option value="">— Port —</option>
          {connectedPorts.map((p) => (
            <option key={p.port} value={p.port}>
              {p.port} ({p.boardName})
            </option>
          ))}
          {portPath && !connectedPorts.find((p) => p.port === portPath) && (
            <option value={portPath}>{portPath}</option>
          )}
        </select>

        {/* Baud rate */}
        <select
          value={baudRate}
          onChange={(e) => setBaudRate(Number(e.target.value))}
          disabled={isConnected || isConnecting}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        >
          {BAUD_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate} baud
            </option>
          ))}
        </select>

        {/* Connect/Disconnect */}
        {isConnected ? (
          <button
            onClick={disconnect}
            className="px-3 py-1 text-xs rounded bg-red-700 hover:bg-red-600 text-white transition-colors"
          >
            Déconnecter
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={!portPath || isConnecting}
            className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConnecting ? "..." : "Connecter"}
          </button>
        )}

        {/* Status */}
        <span className={`text-xs ${statusColor} ml-1`}>● {statusLabel}</span>

        <div className="flex-1" />

        {/* Graph toggle */}
        <button
          onClick={toggleGraphMode}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            graphMode
              ? "bg-blue-700 text-blue-200"
              : "bg-gray-800 hover:bg-gray-700 text-gray-400"
          }`}
          title="Mode graphique"
        >
          📈
        </button>

        {/* Refresh ports */}
        <button
          onClick={detectBoards}
          disabled={isConnected}
          className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-40"
          title="Actualiser les ports"
        >
          ↻
        </button>

        {/* Clear */}
        <button
          onClick={clear}
          className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
        >
          Effacer
        </button>
      </div>

      {/* Content: Graph or Terminal */}
      {graphMode ? (
        <div className="flex-1 min-h-0 p-2 bg-gray-950">
          {graphData.length < 2 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-600">
              En attente de valeurs numériques sur le port série...
            </div>
          ) : (
            <SerialGraph data={graphData} />
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-950 font-mono text-xs p-2 space-y-0.5">
          {lines.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600">
              {isConnected ? "En attente de données..." : "Connectez un port série pour commencer."}
            </div>
          ) : (
            lines.map((line, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 py-px ${
                  line.type === "tx" ? "text-blue-400" : "text-gray-300"
                }`}
              >
                <span className="text-gray-700 shrink-0 select-none text-[10px] mt-px">
                  {new Date(line.timestamp).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="text-gray-600 shrink-0 select-none">
                  {line.type === "tx" ? "→" : "←"}
                </span>
                <span className="break-all">{line.text}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 border-t border-gray-800 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!isConnected}
          placeholder={isConnected ? "Envoyer une commande..." : "Non connecté"}
          className="flex-1 px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!isConnected || !input.trim()}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}

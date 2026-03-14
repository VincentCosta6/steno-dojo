import type { PloverStatus } from "../types";

interface ConnectionStatusProps {
  status: PloverStatus;
  machineName?: string;
  machineConnected?: boolean;
  strokeCount?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function ConnectionStatus({
  status,
  machineName,
  machineConnected,
  strokeCount,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  const isConnected = status === "connected";

  // Dot appearance
  const dotClass = isConnected
    ? machineConnected
      ? "bg-[#00ff88] shadow-[0_0_6px_#00ff88]"
      : "bg-[#ffd700] animate-pulse"
    : status === "connecting"
      ? "bg-[#ffd700] animate-pulse"
      : status === "error"
        ? "bg-[#ff3c3c] animate-pulse"
        : "bg-[#445]";

  // Primary label
  const label = isConnected
    ? machineConnected
      ? `Plover · ${machineName || "machine connected"}`
      : "Plover running · waiting for machine"
    : status === "connecting"
      ? "Connecting to Plover…"
      : status === "error"
        ? "Plover · connection error"
        : "Plover not running";

  // Secondary hint
  const hint = isConnected
    ? strokeCount !== undefined && strokeCount > 0
      ? `${strokeCount} stroke${strokeCount !== 1 ? "s" : ""} received`
      : machineConnected
        ? "Ready — start stroking"
        : "Start your steno machine in Plover"
    : status === "disconnected"
      ? "Open Plover and enable the WebSocket plugin"
      : null;

  const labelColor = isConnected
    ? machineConnected
      ? "text-[#00ff88]"
      : "text-[#ffd700]"
    : status === "connecting"
      ? "text-[#ffd700]"
      : status === "error"
        ? "text-[#ff3c3c]"
        : "text-[#556]";

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0d0d1e] border border-[#1a1a3a]">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />

      <div className="flex-1 min-w-0">
        <div className={`text-xs font-mono font-semibold ${labelColor}`}>
          {label}
        </div>
        {hint && (
          <div className="text-[10px] text-[#334] font-mono mt-0.5">{hint}</div>
        )}
      </div>

      {isConnected && onDisconnect && (
        <button
          onClick={onDisconnect}
          className="text-[10px] font-mono text-[#445] hover:text-[#ff3c3c] transition-colors"
        >
          disconnect
        </button>
      )}
      {(status === "disconnected" || status === "error") && onConnect && (
        <button
          onClick={onConnect}
          className="text-[10px] font-mono text-[#445] hover:text-[#00d4ff] transition-colors"
        >
          retry
        </button>
      )}
    </div>
  );
}

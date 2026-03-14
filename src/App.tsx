import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore } from "./store/useStore";
import { usePlover } from "./hooks/usePlover";
import { usePluginVersionCheck } from "./hooks/usePluginVersionCheck";
import { BUILT_IN_KEYBOARDS } from "./keyboards";
import { PracticeMode } from "./components/PracticeMode";
import { TestMode } from "./components/TestMode";
import { Settings } from "./components/Settings";
import { Onboarding } from "./components/Onboarding";
import { StenoKeyboard } from "./components/StenoKeyboard";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { WindowControls, startDrag } from "./components/WindowControls";
import { PluginVersionBanner } from "./components/PluginVersionBanner";
import type { AppMode, KeyboardDefinition } from "./types";

export default function App() {
  const { mode, setMode, settings, updateSettings, setReverseDictionary } = useStore();

  const plover = usePlover(settings.ploverWsUrl);
  const versionCheck = usePluginVersionCheck(
    plover.pluginVersion,
    plover.status === "connected",
  );
  const [versionDismissed, setVersionDismissed] = useState(false);
  // Re-show banners when a new connection is established
  useEffect(() => {
    if (plover.status === "connected") setVersionDismissed(false);
  }, [plover.status]);

  const keyboard =
    BUILT_IN_KEYBOARDS.find((k) => k.id === settings.keyboardId) ??
    BUILT_IN_KEYBOARDS[0];

  const loadDictionary = useCallback(
    async (path: string) => {
      const dict = await invoke<Record<string, string[]>>(
        "load_plover_dictionary",
        { path }
      );
      setReverseDictionary(dict);
    },
    [setReverseDictionary]
  );

  useEffect(() => {
    if (settings.dictionaryPath) {
      loadDictionary(settings.dictionaryPath).catch(() => {});
    }
  }, []);

  // Auto-load dictionary when connected if none is set
  useEffect(() => {
    if (
      plover.status === "connected" &&
      !settings.dictionaryPath &&
      plover.dictionaries.length > 0
    ) {
      // Prefer the first JSON dictionary, fallback to the first available if none.
      const mainDict =
        plover.dictionaries.find((d) => d.endsWith(".json")) ||
        plover.dictionaries[0];
      if (mainDict) {
        updateSettings({ dictionaryPath: mainDict });
        loadDictionary(mainDict).catch(() => {});
      }
    }
  }, [
    plover.status,
    plover.dictionaries,
    settings.dictionaryPath,
    updateSettings,
    loadDictionary,
  ]);

  // Show onboarding for first-time users
  if (!settings.onboardingComplete) {
    return (
      <Onboarding
        plover={plover}
        onComplete={() => {
          updateSettings({ onboardingComplete: true });
          setMode("home");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#080810] text-[#d0d8e8] font-display select-none overflow-hidden">
      {/* ── Title Bar ────────────────────────────────────────────────── */}
      <TitleBar
        mode={mode}
        onModeChange={setMode}
        ploverStatus={plover.status}
        ploverStrokeCount={plover.strokeCount}
        pluginVersionStatus={versionCheck.status}
      />

      {/* ── Plugin version banner ─────────────────────────────────────── */}
      {!versionDismissed && (
        <PluginVersionBanner
          {...versionCheck}
          onDismiss={
            versionCheck.status === "update_available"
              ? () => setVersionDismissed(true)
              : undefined
          }
        />
      )}

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {mode === "home" && (
          <HomeScreen onMode={setMode} plover={plover} keyboard={keyboard} />
        )}
        {mode === "practice" && (
          <PracticeMode keyboard={keyboard} plover={plover} />
        )}
        {mode === "test" && (
          <TestMode keyboard={keyboard} plover={plover} />
        )}
        {mode === "settings" && (
          <Settings
            plover={plover}
            onConnect={(url) => plover.connect(url)}
            onDisconnect={() => plover.disconnect()}
            onLoadDictionary={loadDictionary}
            onRestartOnboarding={() => {
              updateSettings({ onboardingComplete: false });
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Title Bar ───────────────────────────────────────────────────────────────

function TitleBar({
  mode,
  onModeChange,
  ploverStatus,
  ploverStrokeCount,
  pluginVersionStatus,
}: {
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  ploverStatus: string;
  ploverStrokeCount: number;
  pluginVersionStatus: string;
}) {
  const statusColor =
    ploverStatus === "connected"
      ? "text-[#00ff88]"
      : ploverStatus === "connecting"
        ? "text-[#ffd700]"
        : "text-[#334]";

  return (
    <div
      className="flex items-center h-11 border-b border-[#1a1a3a] bg-[#0a0a18] flex-shrink-0"
      onMouseDown={startDrag}
    >
      {/* Window controls — left-aligned, macOS style */}
      <div className="flex items-center px-4">
        <WindowControls />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#1a1a3a]" />

      {/* App title */}
      <div className="flex items-center gap-2 px-4">
        <span className="text-base">⛩️</span>
        <span className="font-mono font-bold text-sm text-[#d0d8e8]">
          Steno Dojo
        </span>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-1">
        {(["home", "practice", "test"] as AppMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="px-3 py-1 rounded font-mono text-xs uppercase tracking-wider transition-colors"
            style={{
              color: mode === m ? "#d0d8e8" : "#445",
              background: mode === m ? "#1a1a3a" : "transparent",
            }}
          >
            {m}
          </button>
        ))}
      </nav>

      {/* Fills remaining space */}
      <div className="flex-1" />

      {/* Plover status */}
      <div className="flex items-center gap-1.5 pr-3">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            ploverStatus === "connected"
              ? "bg-[#00ff88] shadow-[0_0_4px_#00ff88]"
              : ploverStatus === "connecting"
                ? "bg-[#ffd700] animate-pulse"
                : "bg-[#334]"
          }`}
        />
        <span className={`text-[10px] font-mono ${statusColor}`}>
          {ploverStatus === "connected"
            ? `Plover · ${ploverStrokeCount} strokes`
            : ploverStatus === "connecting"
              ? "Connecting…"
              : "Plover offline"}
        </span>
        {(pluginVersionStatus === "too_old" || pluginVersionStatus === "legacy") && (
          <span className="text-[9px] font-mono text-red-400 bg-red-950/60 border border-red-700/40 px-1 rounded">
            plugin outdated
          </span>
        )}
        {pluginVersionStatus === "update_available" && (
          <span className="text-[9px] font-mono text-yellow-400 bg-yellow-950/60 border border-yellow-700/40 px-1 rounded">
            update available
          </span>
        )}
      </div>

      {/* Settings button */}
      <button
        onClick={() => onModeChange(mode === "settings" ? "home" : "settings")}
        className={`p-1.5 mr-4 rounded transition-colors font-mono text-xs ${
          mode === "settings"
            ? "bg-[#1a1a3a] text-[#00d4ff]"
            : "text-[#445] hover:text-[#d0d8e8]"
        }`}
        title="Settings"
      >
        ⚙
      </button>
    </div>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

function HomeScreen({
  onMode,
  plover,
  keyboard,
}: {
  onMode: (m: AppMode) => void;
  plover: ReturnType<typeof usePlover>;
  keyboard: KeyboardDefinition;
}) {
  return (
    <div className="flex flex-col min-h-full p-6 gap-6">
      {/* Hero */}
      <div className="text-center space-y-2 pt-4">
        <div className="text-5xl">⛩️</div>
        <h1 className="text-4xl font-black font-mono text-[#d0d8e8]">
          Steno <span className="text-[#00d4ff]">Dojo</span>
        </h1>
        <p className="text-[#445] font-mono text-sm">
          Master stenography at full speed
        </p>
      </div>

      {/* Mode cards */}
      <div className="flex gap-4 justify-center">
        <ModeCard
          emoji="📝"
          title="Practice"
          description="Learn word by word with live hints and keyboard guidance"
          color="#00d4ff"
          onClick={() => onMode("practice")}
        />
        <ModeCard
          emoji="🏁"
          title="Test"
          description="Race through sentences with no hints — measure your true speed"
          color="#ffd700"
          onClick={() => onMode("test")}
        />
      </div>

      {/* Connection status */}
      <div className="max-w-md mx-auto w-full">
        <ConnectionStatus
          status={plover.status}
          machineName={plover.machineName}
          machineConnected={plover.machineConnected}
          strokeCount={plover.strokeCount}
        />
        {plover.status !== "connected" && (
          <div className="mt-2 text-xs text-[#334] font-mono text-center space-y-1">
            <p>Make sure Plover is running with plover-steno-dojo enabled</p>
            <button
              onClick={() => onMode("settings")}
              className="text-[#00d4ff] hover:underline"
            >
              Open Settings to configure →
            </button>
          </div>
        )}
      </div>

      {/* Live keyboard preview */}
      <div className="flex-1 flex items-end justify-center pb-2 min-h-[300px]">
        <div className="w-full max-w-2xl">
          <p className="text-[10px] text-[#334] font-mono uppercase tracking-widest text-center mb-2">
            Live keyboard preview — start stroking
          </p>
          <StenoKeyboard keyboard={keyboard} activeKeys={plover.activeKeys} />
        </div>
      </div>
    </div>
  );
}

function ModeCard({
  emoji,
  title,
  description,
  color,
  onClick,
}: {
  emoji: string;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-6 rounded-2xl border bg-[#0d0d1e] hover:bg-[#111122] transition-all duration-200 text-left max-w-[200px] group"
      style={{ borderColor: "#1a1a3a" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${color}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1a1a3a";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div className="text-3xl">{emoji}</div>
      <div className="text-lg font-bold font-mono" style={{ color }}>
        {title}
      </div>
      <div className="text-xs text-[#445] font-mono text-center leading-relaxed">
        {description}
      </div>
    </button>
  );
}

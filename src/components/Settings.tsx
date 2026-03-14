import { useState, useCallback } from "react";
import { useStore } from "../store/useStore";
import { BUILT_IN_KEYBOARDS } from "../keyboards";
import { open } from "@tauri-apps/plugin-dialog";
import { openLink } from "../utils/openLink";
import type { KeyboardDefinition, Difficulty } from "../types";
import type { PloverState } from "../hooks/usePlover";

interface SettingsProps {
  plover: PloverState;
  onConnect: (url: string) => void;
  onDisconnect: () => void;
  onLoadDictionary: (path: string) => Promise<void>;
  onRestartOnboarding: () => void;
}

export function Settings({
  plover,
  onConnect,
  onDisconnect,
  onLoadDictionary,
  onRestartOnboarding,
}: SettingsProps) {
  const { settings, updateSettings } = useStore();
  const [wsUrl, setWsUrl] = useState(settings.ploverWsUrl);
  const [dictPath, setDictPath] = useState(settings.dictionaryPath);
  const [dictLoading, setDictLoading] = useState(false);
  const [dictStatus, setDictStatus] = useState<"idle" | "ok" | "error">("idle");

  const handleConnectPlover = () => {
    updateSettings({ ploverWsUrl: wsUrl });
    onConnect(wsUrl);
  };

  const handleBrowseDict = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Plover Dictionary", extensions: ["json"] }],
    });
    if (typeof selected === "string") {
      setDictPath(selected);
    }
  };

  const handleLoadDict = useCallback(async () => {
    if (!dictPath) return;
    setDictLoading(true);
    setDictStatus("idle");
    try {
      await onLoadDictionary(dictPath);
      updateSettings({ dictionaryPath: dictPath });
      setDictStatus("ok");
    } catch {
      setDictStatus("error");
    } finally {
      setDictLoading(false);
    }
  }, [dictPath, onLoadDictionary, updateSettings]);

  return (
    <div className="flex flex-col h-full bg-[#080810] text-[#d0d8e8] overflow-hidden">
      {/* Page header */}
      <div className="px-8 py-6 border-b border-[#1a1a3a] flex-shrink-0">
        <h1 className="text-2xl font-black font-mono text-[#d0d8e8]">
          Settings
        </h1>
        <p className="text-sm font-mono text-[#445] mt-1">
          Configure Plover, keyboards, and practice options
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-6 space-y-8">

          {/* ── Plover Connection ──────────────────────────────────────── */}
          <Section title="Plover Connection" icon="🔌">
            <p className="text-xs text-[#445] font-mono mb-3">
              Steno Dojo connects to Plover via WebSocket. Make sure the{" "}
              <span className="text-[#00d4ff]">plover-steno-dojo</span>{" "}
              plugin is installed in Plover and enabled.
            </p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => openLink("https://github.com/openstenoproject/plover/releases/latest")}
                className="text-xs font-mono text-[#445] hover:text-[#00d4ff] transition-colors"
              >
                Get Plover ↗
              </button>
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#0d0d1e] border border-[#1a1a3a] rounded-lg px-3 py-2 text-sm font-mono text-[#d0d8e8] focus:outline-none focus:border-[#00d4ff] placeholder:text-[#334]"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:8086/"
              />
              {plover.status === "connected" ? (
                <button
                  onClick={onDisconnect}
                  className="px-4 py-2 bg-[#330000] border border-[#440000] text-[#ff3c3c] font-mono text-sm rounded-lg hover:bg-[#440000] transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectPlover}
                  className="px-4 py-2 bg-[#001a33] border border-[#002244] text-[#00d4ff] font-mono text-sm rounded-lg hover:bg-[#002244] transition-colors"
                >
                  Connect
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  plover.status === "connected"
                    ? "bg-[#00ff88] shadow-[0_0_4px_#00ff88]"
                    : plover.status === "connecting"
                      ? "bg-[#ffd700] animate-pulse"
                      : "bg-[#334]"
                }`}
              />
              <StatusLabel status={plover.status} machineName={plover.machineName} />
            </div>
          </Section>

          {/* ── Dictionary ─────────────────────────────────────────────── */}
          <Section title="Plover Dictionary" icon="📖">
            <p className="text-xs text-[#445] font-mono mb-4">
              Load your Plover{" "}
              <span className="text-[#00d4ff]">main.json</span> to enable stroke
              hints in Practice mode.
            </p>
            <p className="text-xs text-[#334] font-mono mb-3">
              Default path on macOS:{" "}
              <span className="text-[#556]">
                ~/Library/Application Support/plover/main.json
              </span>
            </p>

            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#0d0d1e] border border-[#1a1a3a] rounded-lg px-3 py-2 text-sm font-mono text-[#d0d8e8] focus:outline-none focus:border-[#00d4ff] placeholder:text-[#334]"
                value={dictPath}
                onChange={(e) => setDictPath(e.target.value)}
                placeholder="/path/to/main.json"
              />
              <button
                onClick={handleBrowseDict}
                className="px-3 py-2 bg-[#0d0d1e] border border-[#1a1a3a] text-[#556] font-mono text-sm rounded-lg hover:border-[#00d4ff] hover:text-[#00d4ff] transition-colors"
                title="Browse for file"
              >
                Browse
              </button>
              <button
                onClick={handleLoadDict}
                disabled={!dictPath || dictLoading}
                className="px-4 py-2 bg-[#001a33] border border-[#002244] text-[#00d4ff] font-mono text-sm rounded-lg hover:bg-[#002244] transition-colors disabled:opacity-40"
              >
                {dictLoading ? "Loading…" : "Load"}
              </button>
            </div>

            {dictStatus === "ok" && (
              <p className="text-xs text-[#00ff88] font-mono mt-2">
                ✓ Dictionary loaded successfully
              </p>
            )}
            {dictStatus === "error" && (
              <p className="text-xs text-[#ff3c3c] font-mono mt-2">
                ✗ Failed to load dictionary — check the path
              </p>
            )}
          </Section>

          {/* ── Keyboard Layout ────────────────────────────────────────── */}
          <Section title="Keyboard Layout" icon="⌨️">
            <p className="text-xs text-[#445] font-mono mb-4">
              Select the steno keyboard you're using. The active keyboard is
              shown during practice and on the home screen.
            </p>
            <KeyboardSelector
              selectedId={settings.keyboardId}
              onSelect={(id) => updateSettings({ keyboardId: id })}
            />
          </Section>

          {/* ── Practice Options ───────────────────────────────────────── */}
          <Section title="Practice Options" icon="🎯">
            <div className="space-y-5">
              <div>
                <label className="text-xs text-[#556] font-mono uppercase tracking-wider">
                  Difficulty
                </label>
                <div className="flex gap-2 mt-2">
                  {(["beginner", "intermediate", "advanced"] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => updateSettings({ difficulty: d })}
                      className="flex-1 py-2 text-xs font-mono rounded-lg border transition-colors capitalize"
                      style={{
                        borderColor: settings.difficulty === d ? "#00d4ff" : "#1a1a3a",
                        color: settings.difficulty === d ? "#00d4ff" : "#445",
                        background: settings.difficulty === d ? "#001122" : "#0d0d1e",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <Toggle
                label="Show stroke hints"
                description="Display the recommended stroke below the current word in Practice mode"
                checked={settings.showHints}
                onChange={(v) => updateSettings({ showHints: v })}
              />
            </div>
          </Section>

          {/* ── About / Onboarding ─────────────────────────────────────── */}
          <Section title="About" icon="ℹ️">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d1e] border border-[#1a1a3a]">
                <div>
                  <div className="text-sm font-mono text-[#d0d8e8]">Steno Dojo</div>
                  <div className="text-xs font-mono text-[#445]">Version 0.1.0</div>
                </div>
                <span className="text-2xl">⛩️</span>
              </div>
              <button
                onClick={onRestartOnboarding}
                className="w-full py-2.5 text-xs font-mono text-[#445] border border-[#1a1a3a] rounded-lg hover:border-[#00d4ff] hover:text-[#00d4ff] transition-colors"
              >
                Restart Setup Wizard
              </button>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

// ─── Keyboard Selector ────────────────────────────────────────────────────────

function KeyboardSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {BUILT_IN_KEYBOARDS.map((kb) => {
        const selected = selectedId === kb.id;
        return (
          <KeyboardCard
            key={kb.id}
            keyboard={kb}
            selected={selected}
            onSelect={() => onSelect(kb.id)}
          />
        );
      })}
    </div>
  );
}

function KeyboardCard({
  keyboard,
  selected,
  onSelect,
}: {
  keyboard: KeyboardDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 rounded-xl border transition-all duration-200"
      style={{
        borderColor: selected ? "#00d4ff" : "#1a1a3a",
        background: selected ? "#001122" : "#0d0d1e",
        boxShadow: selected ? "0 0 16px #00d4ff22" : "none",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
          style={{ borderColor: selected ? "#00d4ff" : "#1a1a3a" }}
        >
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#00d4ff]" />}
        </div>
        <div className="flex-1">
          <div className="font-mono font-semibold text-sm text-[#d0d8e8]">
            {keyboard.name}
          </div>
          <div className="text-xs text-[#445] font-mono">{keyboard.manufacturer}</div>
          <div className="text-xs text-[#334] mt-0.5 font-mono">{keyboard.description}</div>
        </div>
        {selected && (
          <span className="text-xs font-mono text-[#00d4ff] font-semibold">Active</span>
        )}
      </div>
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1a1a3a]">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-mono font-semibold text-[#d0d8e8] uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className="w-10 h-5 rounded-full transition-colors"
          style={{ background: checked ? "#00d4ff" : "#1a1a3a" }}
        />
        <div
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
      <div>
        <div className="text-sm font-mono text-[#d0d8e8]">{label}</div>
        <div className="text-xs text-[#445] font-mono">{description}</div>
      </div>
    </label>
  );
}

function StatusLabel({ status, machineName }: { status: string; machineName: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    connected: { color: "text-[#00ff88]", label: `Connected${machineName ? ` · ${machineName}` : ""}` },
    connecting: { color: "text-[#ffd700]", label: "Connecting…" },
    disconnected: { color: "text-[#445]", label: "Not connected" },
    error: { color: "text-[#ff3c3c]", label: "Connection error" },
  };
  const { color, label } = cfg[status] ?? cfg.disconnected;
  return <p className={`text-xs font-mono ${color}`}>{label}</p>;
}

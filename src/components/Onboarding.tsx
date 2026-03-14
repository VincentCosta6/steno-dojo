import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openLink } from "../utils/openLink";
import { useStore } from "../store/useStore";
import { WindowControls, startDrag } from "./WindowControls";
import { BUILT_IN_KEYBOARDS } from "../keyboards";
import { StenoKeyboard } from "./StenoKeyboard";
import type { UsePloverReturn } from "../hooks/usePlover";

// Detect current OS for showing the right download link
const ua = navigator.userAgent;
const IS_MAC = ua.includes("Mac");
const IS_WIN = ua.includes("Win");

const PLOVER_DOWNLOAD_URL = "https://github.com/openstenoproject/plover/releases/latest";
const OPEN_STENO_URL = "https://www.openstenoproject.org/plover/";

interface OnboardingProps {
  plover: UsePloverReturn;
  onComplete: () => void;
}

const TOTAL_STEPS = 5;

export function Onboarding({ plover, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const { settings, updateSettings } = useStore();

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080810] text-[#d0d8e8]">
      {/* Drag strip with window controls */}
      <div
        className="flex items-center h-11 px-4 flex-shrink-0 bg-[#0a0a18] border-b border-[#1a1a3a]"
        onMouseDown={startDrag}
      >
        <WindowControls />
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-[#1a1a3a]">
        <div
          className="h-full bg-[#00d4ff] transition-all duration-500"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="flex justify-center pt-6 pb-2">
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: i <= step ? "#00d4ff" : "#1a1a3a",
                boxShadow: i === step ? "0 0 6px #00d4ff" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
        {step === 0 && <StepWelcome />}
        {step === 1 && <StepInstallPlover />}
        {step === 2 && <StepInstallPlugin />}
        {step === 3 && (
          <StepChooseKeyboard
            selectedId={settings.keyboardId}
            onSelect={(id) => updateSettings({ keyboardId: id })}
          />
        )}
        {step === 4 && <StepConnect plover={plover} selectedKeyboardId={settings.keyboardId} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-8 py-6 border-t border-[#1a1a3a]">
        <button
          onClick={back}
          disabled={step === 0}
          className="px-4 py-2 font-mono text-sm text-[#445] hover:text-[#d0d8e8] transition-colors disabled:opacity-0"
        >
          ← Back
        </button>

        <span className="text-xs font-mono text-[#334]">
          {step + 1} / {TOTAL_STEPS}
        </span>

        {step < TOTAL_STEPS - 1 ? (
          <button
            onClick={next}
            className="px-6 py-2 bg-[#001a33] border border-[#00d4ff] text-[#00d4ff] font-mono text-sm rounded-lg hover:bg-[#002244] transition-colors"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={finish}
            className="px-6 py-2 font-mono text-sm rounded-lg transition-colors"
            style={{
              background: "#00d4ff",
              color: "#080810",
              fontWeight: 700,
            }}
          >
            Start Training →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 0: Welcome ─────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="max-w-lg text-center space-y-6">
      <div className="text-7xl">⛩️</div>
      <div>
        <h1 className="text-4xl font-black font-mono text-[#d0d8e8] mb-3">
          Welcome to{" "}
          <span className="text-[#00d4ff]">Steno Dojo</span>
        </h1>
        <p className="text-[#556] font-mono text-base leading-relaxed">
          Your training ground for mastering stenography.
          We'll get you set up in just a few steps.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-2">
        {[
          { icon: "📥", label: "Install Plover" },
          { icon: "🔌", label: "Add plugin" },
          { icon: "⌨️", label: "Choose keyboard" },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#1a1a3a] bg-[#0d0d1e]"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-mono text-[#445]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1: Install Plover ───────────────────────────────────────────────────

type BrewState = "checking" | "available" | "unavailable" | "installing" | "done" | "error";

function StepInstallPlover() {
  const platformLabel = IS_MAC ? "macOS" : IS_WIN ? "Windows" : "Linux";
  const [brewState, setBrewState] = useState<BrewState>("checking");
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // Check for Plover installation (app bundle first, then brew cask)
  useEffect(() => {
    (async () => {
      // Check if Plover.app / plover.exe already exists on disk
      const appInstalled = await invoke<boolean>("check_plover_app_installed");
      if (appInstalled) {
        setAlreadyInstalled(true);
        setBrewState("done");
        return;
      }

      if (!IS_MAC) {
        setBrewState("unavailable");
        return;
      }

      // macOS: see if brew is available
      const hasBrew = await invoke<boolean>("check_brew_available");
      if (!hasBrew) {
        setBrewState("unavailable");
        return;
      }

      // Brew exists — check if plover cask is already installed
      const brewPlover = await invoke<boolean>("check_plover_brew_installed");
      if (brewPlover) {
        setAlreadyInstalled(true);
        setBrewState("done");
        return;
      }

      setBrewState("available");
    })();
  }, []);

  // Auto-scroll the log box
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [outputLines]);

  const runBrewInstall = async () => {
    setBrewState("installing");
    setOutputLines([]);
    setErrorMsg("");

    // Listen for streaming output
    const unlisten = await listen<string>("brew-progress", (e) => {
      const line = e.payload.trim();
      if (line) setOutputLines((prev) => [...prev.slice(-80), line]); // keep last 80 lines
    });

    try {
      await invoke("brew_install_plover");
      setBrewState("done");
    } catch (err) {
      setErrorMsg(String(err));
      setBrewState("error");
    } finally {
      unlisten();
    }
  };

  return (
    <div className="max-w-lg w-full space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-4">📥</div>
        <h2 className="text-2xl font-bold font-mono text-[#d0d8e8]">
          Install Plover
        </h2>
        <p className="text-[#556] font-mono text-sm mt-2">
          Plover is the free, open-source stenography engine that powers Steno Dojo.
        </p>
      </div>

      {/* ── macOS brew flow ── */}
      {IS_MAC && (
        <>
          {brewState === "checking" && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-[#1a1a3a] bg-[#0d0d1e]">
              <div className="w-4 h-4 rounded-full border-2 border-[#00d4ff] border-t-transparent animate-spin" />
              <span className="text-sm font-mono text-[#445]">Checking for Homebrew…</span>
            </div>
          )}

          {brewState === "available" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#00d4ff33] bg-[#001122] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🍺</span>
                  <span className="text-sm font-mono font-semibold text-[#d0d8e8]">Homebrew detected</span>
                </div>
                <p className="text-xs font-mono text-[#445]">
                  We can install Plover for you. Homebrew verifies every download with
                  SHA256 checksums — no sketchy installers.
                </p>
                <button
                  onClick={runBrewInstall}
                  className="w-full py-2.5 rounded-lg font-mono font-bold text-sm transition-all"
                  style={{ background: "#00d4ff", color: "#080810" }}
                >
                  Install Plover with Homebrew
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#1a1a3a]" />
                <span className="text-xs font-mono text-[#334]">or install manually</span>
                <div className="flex-1 h-px bg-[#1a1a3a]" />
              </div>
            </div>
          )}

          {brewState === "installing" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#ffd700]">
                <div className="w-3 h-3 rounded-full border-2 border-[#ffd700] border-t-transparent animate-spin" />
                <span>Installing via Homebrew…</span>
              </div>
              <div
                ref={logRef}
                className="h-40 overflow-y-auto rounded-lg bg-[#050508] border border-[#1a1a3a] p-3 font-mono text-[10px] text-[#445] space-y-0.5"
              >
                {outputLines.length === 0 ? (
                  <span className="text-[#334]">Starting…</span>
                ) : (
                  outputLines.map((line, i) => <div key={i}>{line}</div>)
                )}
              </div>
            </div>
          )}

          {brewState === "done" && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-[#00ff8844] bg-[#001a0d]">
              <span className="text-xl">✓</span>
              <div>
                <div className="text-sm font-mono font-semibold text-[#00ff88]">
                  {alreadyInstalled ? "Plover is already installed" : "Plover installed successfully!"}
                </div>
                <div className="text-xs font-mono text-[#445] mt-0.5">
                  {alreadyInstalled ? "Found via Homebrew" : "Installed via Homebrew"}
                </div>
              </div>
            </div>
          )}

          {brewState === "error" && (
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-[#ff3c3c44] bg-[#1a0000]">
                <span className="text-base mt-0.5">✗</span>
                <div>
                  <div className="text-sm font-mono font-semibold text-[#ff3c3c]">Installation failed</div>
                  <div className="text-xs font-mono text-[#556] mt-1 break-all">{errorMsg}</div>
                </div>
              </div>
              <button
                onClick={runBrewInstall}
                className="w-full py-2 rounded-lg font-mono text-xs text-[#445] border border-[#1a1a3a] hover:border-[#334] transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Manual download (always shown, de-emphasized on macOS when brew works) ── */}
      {(brewState === "unavailable" || brewState === "available" || brewState === "error") && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => openLink(PLOVER_DOWNLOAD_URL)}
            className="w-full py-3 rounded-xl font-mono font-bold text-sm transition-all"
            style={
              IS_MAC && brewState === "available"
                ? { background: "#0d0d1e", color: "#445", border: "1px solid #1a1a3a" }
                : { background: "#00d4ff", color: "#080810" }
            }
          >
            Download Plover for {platformLabel} →
          </button>
          <button
            onClick={() => openLink(OPEN_STENO_URL)}
            className="w-full py-2 rounded-xl font-mono text-xs text-[#334] hover:text-[#445] transition-colors"
          >
            openstenoproject.org ↗
          </button>
        </div>
      )}

      {brewState !== "installing" && brewState !== "done" && (
        <div className="space-y-2.5">
          <Step number={1} text="Install Plover using one of the options above" />
          <Step number={2} text="Launch Plover — you'll see a small window with a paper tape" />
        </div>
      )}

      <p className="text-center text-xs text-[#334] font-mono">
        Already have Plover? Click Continue →
      </p>
    </div>
  );
}

function StepInstallPlugin() {
  return (
    <div className="max-w-lg w-full space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-4">🔌</div>
        <h2 className="text-2xl font-bold font-mono text-[#d0d8e8]">
          Install the Dojo Plugin
        </h2>
        <p className="text-[#556] font-mono text-sm mt-2">
          Steno Dojo needs the <strong className="text-[#00d4ff]">plover-steno-dojo</strong> plugin to receive your strokes.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        <Step
          number={1}
          text={
            <>
              Open Plover and go to <span className="text-[#00d4ff] font-mono">Tools → Plug-ins Manager</span>
            </>
          }
        />
        <Step
          number={2}
          text={
            <>
              Scroll down to find <span className="text-[#00d4ff] font-mono">plover-steno-dojo</span>
            </>
          }
        />
        <Step
          number={3}
          text={
            <>
              Click <span className="text-[#ffd700]">Install</span> and wait for it to finish.
            </>
          }
        />
        <Step
          number={4}
          text={
            <>
              Restart Plover. The websocket server will start automatically!
            </>
          }
        />
      </div>

      <div className="p-3 rounded-lg border border-[#ffd70033] bg-[#1a1100] mt-4">
        <p className="text-xs font-mono text-[#ffd700]">
          💡 The plugin listens on{" "}
          <span className="font-semibold">ws://localhost:8086/</span> — no extra configuration needed.
        </p>
      </div>
    </div>
  );
}

// ─── Step 3: Choose Keyboard ──────────────────────────────────────────────────

function StepChooseKeyboard({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="max-w-lg w-full space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">⌨️</div>
        <h2 className="text-2xl font-bold font-mono text-[#d0d8e8]">
          Choose Your Keyboard
        </h2>
        <p className="text-[#556] font-mono text-sm mt-2">
          Select the steno keyboard you'll be using for training.
        </p>
      </div>

      <div className="space-y-3">
        {BUILT_IN_KEYBOARDS.map((kb) => {
          const selected = selectedId === kb.id;
          return (
            <button
              key={kb.id}
              onClick={() => onSelect(kb.id)}
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
                  {selected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00d4ff]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-mono font-semibold text-sm text-[#d0d8e8]">
                    {kb.name}
                  </div>
                  <div className="text-xs text-[#445] font-mono">
                    {kb.manufacturer}
                  </div>
                  <div className="text-xs text-[#334] mt-0.5 font-mono">
                    {kb.description}
                  </div>
                </div>
                {selected && (
                  <span className="text-xs font-mono text-[#00d4ff] ml-2">Selected</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-[#334] font-mono">
        You can always change this later in Settings.
      </p>
    </div>
  );
}

// ─── Step 4: Connect & Test ───────────────────────────────────────────────────

function StepConnect({
  plover,
  selectedKeyboardId,
}: {
  plover: UsePloverReturn;
  selectedKeyboardId: string;
}) {
  const keyboard =
    BUILT_IN_KEYBOARDS.find((k) => k.id === selectedKeyboardId) ??
    BUILT_IN_KEYBOARDS[0];

  const isConnected = plover.status === "connected";

  return (
    <div className="max-w-2xl w-full space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-2xl font-bold font-mono text-[#d0d8e8]">
          Connect & Test
        </h2>
        <p className="text-[#556] font-mono text-sm mt-2">
          Make sure Plover is running with the plugin enabled, then try a stroke.
        </p>
      </div>

      {/* Connection status */}
      <div
        className="flex items-center gap-4 p-4 rounded-xl border"
        style={{
          borderColor: isConnected ? "#00ff8844" : "#1a1a3a",
          background: isConnected ? "#001a0d" : "#0d0d1e",
        }}
      >
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${isConnected
              ? plover.machineConnected
                ? "bg-[#00ff88] shadow-[0_0_8px_#00ff88]"
                : "bg-[#ffd700] animate-pulse"
              : plover.status === "connecting"
                ? "bg-[#ffd700] animate-pulse"
                : "bg-[#334]"
            }`}
        />
        <div className="flex-1">
          <div
            className="font-mono text-sm font-semibold"
            style={{
              color: isConnected
                ? plover.machineConnected ? "#00ff88" : "#ffd700"
                : plover.status === "connecting" ? "#ffd700" : "#556",
            }}
          >
            {isConnected
              ? plover.machineConnected
                ? `Plover · ${plover.machineName || "machine connected"}`
                : "Plover running · waiting for machine"
              : plover.status === "connecting"
                ? "Connecting…"
                : "Plover not detected"}
          </div>
          <div className="text-xs font-mono text-[#334] mt-0.5">
            {isConnected
              ? plover.strokeCount > 0
                ? `${plover.strokeCount} stroke${plover.strokeCount !== 1 ? "s" : ""} received`
                : plover.machineConnected ? "Ready — try a stroke" : "Connect your machine in Plover"
              : "ws://localhost:8086/"}
          </div>
        </div>
        {!isConnected && (
          <button
            onClick={() => plover.connect("ws://localhost:8086/")}
            className="px-3 py-1.5 bg-[#001a33] border border-[#002244] text-[#00d4ff] font-mono text-xs rounded hover:bg-[#002244] transition-colors"
          >
            Retry
          </button>
        )}
      </div>

      {/* Live keyboard preview */}
      <div>
        <p className="text-[10px] text-[#334] font-mono uppercase tracking-widest text-center mb-3">
          {isConnected ? "Stroke a key to see it light up" : "Connect Plover to see live input"}
        </p>
        <StenoKeyboard keyboard={keyboard} activeKeys={plover.activeKeys} />
      </div>

      {plover.lastStroke && (
        <div className="text-center">
          <span className="font-mono text-[#00d4ff] text-sm">
            Last stroke: <strong>{plover.lastStroke}</strong>
          </span>
        </div>
      )}

      <p className="text-center text-xs text-[#334] font-mono">
        Can't connect? You can skip this and connect from Settings later.
      </p>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Step({ number, text }: { number: number; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[#1a1a3a] flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-mono font-bold text-[#00d4ff]">{number}</span>
      </div>
      <p className="text-sm font-mono text-[#d0d8e8] leading-relaxed">{text}</p>
    </div>
  );
}


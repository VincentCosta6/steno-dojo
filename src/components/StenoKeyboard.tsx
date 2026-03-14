import type { KeyboardDefinition, KeyDefinition } from "../types";

interface StenoKeyboardProps {
  keyboard: KeyboardDefinition;
  /** Keys to highlight as "currently active" (last stroke) */
  activeKeys?: string[];
  /** Keys to highlight as "hint" (what to press) */
  hintKeys?: string[];
  /** Keys that are both active and hint (correct match) */
  className?: string;
}

type KeyState = "idle" | "hint" | "active" | "correct";

function getKeyState(
  stenoKey: string,
  activeKeys: string[],
  hintKeys: string[]
): KeyState {
  const isActive = activeKeys.includes(stenoKey);
  const isHint = hintKeys.includes(stenoKey);
  if (isActive && isHint) return "correct";
  if (isActive) return "active";
  if (isHint) return "hint";
  return "idle";
}

const KEY_STATE_CLASSES: Record<KeyState, string> = {
  idle: "bg-[#1a1a2e] border-[#2a2a4a] text-[#6066aa] hover:bg-[#1e1e38]",
  hint: "bg-[#003355] border-[#00aaff] text-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.4)]",
  active:
    "bg-[#002800] border-[#00ff88] text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.5)] scale-[0.97]",
  correct:
    "bg-[#00330f] border-[#00ff88] text-[#00ff88] shadow-[0_0_16px_rgba(0,255,136,0.7)] scale-[0.97]",
};

interface KeyProps {
  def: KeyDefinition;
  state: KeyState;
  totalRows: number;
  totalCols: number;
}

function Key({ def, state }: KeyProps) {
  const col = def.col + 1; // CSS grid is 1-indexed
  const row = def.row + 1;
  const colSpan = def.colSpan ?? 1;
  const rowSpan = def.rowSpan ?? 1;

  const isNumberBar = def.stenoKey === "#" && (def.colSpan ?? 1) > 1;

  return (
    <div
      style={{
        gridColumn: `${col} / span ${colSpan}`,
        gridRow: `${row} / span ${rowSpan}`,
      }}
      className={[
        "relative flex items-center justify-center",
        "rounded border transition-all duration-75 select-none",
        "font-mono font-bold",
        isNumberBar ? "text-xs tracking-widest" : "text-sm",
        KEY_STATE_CLASSES[state],
      ].join(" ")}
    >
      <span className={def.stenoKey === "#" ? "opacity-60" : ""}>{def.label}</span>

      {/* Subtle glow animation for hint keys */}
      {state === "hint" && (
        <div className="absolute inset-0 rounded animate-pulse opacity-20 bg-[#00d4ff]" />
      )}
    </div>
  );
}

export function StenoKeyboard({
  keyboard,
  activeKeys = [],
  hintKeys = [],
  className = "",
}: StenoKeyboardProps) {
  const { gridCols, gridRows, keys } = keyboard;

  const rowHeights = (
    keyboard.rowHeights ??
    Array.from({ length: gridRows }, (_, i) => {
      if (i === 0) return "32px"; // number bar
      if (i === gridRows - 1) return "52px"; // thumb row
      return "58px"; // main rows
    })
  ).join(" ");

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Keyboard label */}
      <div className="flex justify-between items-center px-1 mb-1">
        <span className="text-xs text-[#445] font-mono uppercase tracking-wider">
          {keyboard.name}
        </span>
        <span className="text-xs text-[#334] font-mono">
          {keyboard.manufacturer}
        </span>
      </div>

      {/* Key grid */}
      <div
        className="p-3 rounded-xl border border-[#1a1a3a] bg-[#0d0d1e]"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: rowHeights,
          gap: "4px",
        }}
      >
        {keys.map((key) => (
          <Key
            key={key.id}
            def={key}
            state={getKeyState(key.stenoKey, activeKeys, hintKeys)}
            totalRows={gridRows}
            totalCols={gridCols}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-1 mt-1">
        <LegendItem color="border-[#00aaff] bg-[#003355]" label="Hint" />
        <LegendItem
          color="border-[#00ff88] bg-[#002800]"
          label="Active stroke"
        />
        <LegendItem color="border-[#2a2a4a] bg-[#1a1a2e]" label="Idle" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-sm border ${color}`} />
      <span className="text-[10px] text-[#445] font-mono">{label}</span>
    </div>
  );
}

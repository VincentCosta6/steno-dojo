interface RaceTrackProps {
  progress: number; // 0–1
  wpm: number;
  lapCount?: number;
  totalLaps?: number;
}

export function RaceTrack({
  progress,
  wpm,
  lapCount = 0,
  totalLaps = 1,
}: RaceTrackProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const pct = Math.round(clampedProgress * 100);

  const speedClass =
    wpm > 100
      ? "text-[#00ff88]"
      : wpm > 60
        ? "text-[#ffd700]"
        : wpm > 30
          ? "text-[#00d4ff]"
          : "text-[#6066aa]";

  return (
    <div className="w-full space-y-2">
      {/* Speed + lap counter */}
      <div className="flex justify-between items-baseline px-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-mono tabular-nums ${speedClass}`}>
            {wpm}
          </span>
          <span className="text-xs text-[#445] font-mono uppercase tracking-widest">
            WPM
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#445]">
          <span>
            LAP {lapCount + 1}/{totalLaps}
          </span>
          <span className="text-[#334]">·</span>
          <span>{pct}%</span>
        </div>
      </div>

      {/* Track */}
      <div className="relative w-full h-10 rounded-full bg-[#0d0d1e] border border-[#1a1a3a] overflow-hidden">
        {/* Track lines */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-[#ffffff08] h-full"
            />
          ))}
        </div>

        {/* Progress bar */}
        <div
          className="absolute left-0 top-0 h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${pct}%`,
            background:
              wpm > 100
                ? "linear-gradient(90deg, #003300, #00ff88)"
                : wpm > 60
                  ? "linear-gradient(90deg, #332200, #ffd700)"
                  : "linear-gradient(90deg, #001133, #00d4ff)",
          }}
        />

        {/* Car emoji */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-xl transition-all duration-300 ease-out z-10 select-none"
          style={{ left: `${Math.max(5, pct)}%` }}
        >
          🏎️
        </div>

        {/* Finish line */}
        <div className="absolute right-0 top-0 w-1 h-full bg-[#ffffff22]">
          <div className="w-full h-full grid grid-rows-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={i % 2 === 0 ? "bg-white" : "bg-black opacity-60"}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

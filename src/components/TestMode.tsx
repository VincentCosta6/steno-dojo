import { useState, useEffect, useRef, useCallback } from "react";
import type { WordState, KeyboardDefinition, TestResult } from "../types";
import { matchesWord, calcWPM, calcAccuracy } from "../hooks/useSteno";
import { StenoKeyboard } from "./StenoKeyboard";
import { RaceTrack } from "./RaceTrack";
import type { PloverState } from "../hooks/usePlover";
import { getRandomSentences } from "../data/sentences";
import { useStore } from "../store/useStore";

interface TestModeProps {
  keyboard: KeyboardDefinition;
  plover: PloverState;
}

type TestPhase = "ready" | "running" | "finished";

const SENTENCE_COUNT = 5;

export function TestMode({ keyboard, plover }: TestModeProps) {
  const { settings } = useStore();
  const [phase, setPhase] = useState<TestPhase>("ready");
  const [words, setWords] = useState<WordState[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [_endTime, setEndTime] = useState<number>(0);
  const [wpm, setWpm] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);
  const lastStrokeRef = useRef<string>("");
  const wpmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildTest = useCallback(() => {
    const sentences = getRandomSentences(SENTENCE_COUNT, settings.difficulty);
    const allWords = sentences.flatMap((s) =>
      s.text.split(/\s+/).filter(Boolean)
    );
    const wordStates: WordState[] = allWords.map((w, i) => ({
      word: w,
      status: i === 0 ? "current" : "pending",
      hintStrokes: [],
    }));
    return wordStates;
  }, [settings.difficulty]);

  const startTest = useCallback(() => {
    const wordStates = buildTest();
    setWords(wordStates);
    setCurrentIdx(0);
    setCorrect(0);
    setIncorrect(0);
    setWpm(0);
    setResult(null);
    lastStrokeRef.current = "";
    const now = Date.now();
    setStartTime(now);
    setPhase("running");

    // WPM is updated by the useEffect below
  }, [buildTest]);

  // Live WPM ticker
  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => {
      setWpm(calcWPM(correct, Date.now() - startTime));
    }, 500);
    return () => clearInterval(timer);
  }, [phase, correct, startTime]);

  // Watch Plover strokes
  useEffect(() => {
    if (phase !== "running") return;
    const { lastStroke, lastTranslation } = plover;
    if (!lastStroke || lastStroke === lastStrokeRef.current) return;
    lastStrokeRef.current = lastStroke;

    const current = words[currentIdx];
    if (!current || current.status !== "current") return;

    const isCorrect = matchesWord(lastTranslation, current.word);

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setWords((prev) => {
        const next = [...prev];
        next[currentIdx] = { ...next[currentIdx], status: "correct", usedStroke: lastStroke };
        const ni = currentIdx + 1;
        if (ni < next.length) next[ni] = { ...next[ni], status: "current" };
        return next;
      });

      const nextIdx = currentIdx + 1;
      if (nextIdx >= words.length) {
        finishTest(correct + 1, incorrect);
      } else {
        setCurrentIdx(nextIdx);
      }
    } else {
      setIncorrect((i) => i + 1);
      setWords((prev) => {
        const next = [...prev];
        next[currentIdx] = { ...next[currentIdx], status: "incorrect" };
        return next;
      });
      // Auto advance on wrong (in test mode, move on after mistake)
      setTimeout(() => {
        setWords((prev) => {
          const next = [...prev];
          if (next[currentIdx]) next[currentIdx] = { ...next[currentIdx], status: "skipped" };
          const ni = currentIdx + 1;
          if (ni < next.length) next[ni] = { ...next[ni], status: "current" };
          return next;
        });
        const nextIdx = currentIdx + 1;
        if (nextIdx >= words.length) {
          finishTest(correct, incorrect + 1);
        } else {
          setCurrentIdx(nextIdx);
        }
      }, 600);
    }
  }, [plover.lastStroke]);

  function finishTest(finalCorrect: number, finalIncorrect: number) {
    const now = Date.now();
    setEndTime(now);
    setPhase("finished");
    if (wpmTimerRef.current) clearInterval(wpmTimerRef.current);

    const durationSeconds = (now - startTime) / 1000;
    const total = finalCorrect + finalIncorrect;
    const finalWpm = calcWPM(finalCorrect, now - startTime);
    const finalAccuracy = calcAccuracy(finalCorrect, total);

    setResult({
      wpm: finalWpm,
      accuracy: finalAccuracy,
      correctWords: finalCorrect,
      incorrectWords: finalIncorrect,
      totalWords: words.length,
      durationSeconds,
    });
  }

  const progress = words.length > 0 ? currentIdx / words.length : 0;

  if (phase === "ready") {
    return <ReadyScreen onStart={startTest} difficulty={settings.difficulty} />;
  }

  if (phase === "finished" && result) {
    return (
      <ResultScreen
        result={result}
        onRetry={() => {
          setPhase("ready");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 p-5">
      {/* Race track */}
      <RaceTrack progress={progress} wpm={wpm} />

      {/* Stats */}
      <div className="flex gap-4 text-xs font-mono text-[#445]">
        <span>
          Correct: <span className="text-[#00ff88]">{correct}</span>
        </span>
        <span>
          Errors: <span className="text-[#ff3c3c]">{incorrect}</span>
        </span>
        <span className="flex-1" />
        <span className="text-[#334]">No hints in test mode</span>
      </div>

      {/* Text display */}
      <div className="flex-1 rounded-xl border border-[#1a1a3a] p-5 overflow-y-auto">
        <div className="flex flex-wrap gap-x-3 gap-y-2 leading-loose">
          {words.map((w, i) => (
            <TestWordChip
              key={`${w.word}-${i}`}
              wordState={w}
              isCurrent={i === currentIdx}
            />
          ))}
        </div>
      </div>

      {/* Keyboard — no hints */}
      <StenoKeyboard
        keyboard={keyboard}
        activeKeys={plover.activeKeys}
        hintKeys={[]}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TestWordChip({
  wordState,
  isCurrent,
}: {
  wordState: WordState;
  isCurrent: boolean;
}) {
  const { word, status } = wordState;
  const cls =
    status === "correct"
      ? "text-[#3a5] opacity-60"
      : status === "incorrect" || status === "skipped"
        ? "text-[#f54] line-through opacity-50"
        : isCurrent
          ? "text-[#ffd700] font-bold px-1.5 py-0.5 bg-[#221a00] rounded border border-[#443300]"
          : "text-[#556]";

  return (
    <span className={`font-mono text-lg transition-all duration-100 ${cls}`}>
      {word}
    </span>
  );
}

function ReadyScreen({
  onStart,
  difficulty,
}: {
  onStart: () => void;
  difficulty: string;
}) {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-8 p-8">
      <div className="text-6xl">🏁</div>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-[#d0d8e8] font-mono">
          Test Mode
        </h2>
        <p className="text-[#556] font-mono text-sm">
          {SENTENCE_COUNT} sentences · {difficulty} · no hints
        </p>
        <p className="text-[#334] font-mono text-xs mt-2">
          Type each word using your steno keyboard. Make sure Plover is running.
        </p>
      </div>
      <button
        onClick={onStart}
        className="px-10 py-3 bg-[#00d4ff] text-[#001520] font-bold font-mono text-lg rounded-xl hover:bg-[#33ddff] transition-colors shadow-[0_0_20px_rgba(0,212,255,0.3)]"
      >
        Start Race
      </button>
    </div>
  );
}

function ResultScreen({
  result,
  onRetry,
}: {
  result: TestResult;
  onRetry: () => void;
}) {
  const grade =
    result.wpm > 100
      ? "S"
      : result.wpm > 80
        ? "A"
        : result.wpm > 60
          ? "B"
          : result.wpm > 40
            ? "C"
            : "D";

  const gradeColor =
    grade === "S"
      ? "text-[#ffd700]"
      : grade === "A"
        ? "text-[#00ff88]"
        : grade === "B"
          ? "text-[#00d4ff]"
          : "text-[#556]";

  return (
    <div className="flex flex-col h-full items-center justify-center gap-8 p-8">
      <div className="text-6xl">🏆</div>

      <div className="text-center space-y-1">
        <div className={`text-7xl font-black font-mono ${gradeColor}`}>
          {grade}
        </div>
        <div className="text-[#445] font-mono text-xs uppercase tracking-widest">
          Rank
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-center">
        <ResultStat label="WPM" value={String(result.wpm)} color="text-[#00d4ff]" />
        <ResultStat
          label="Accuracy"
          value={`${result.accuracy}%`}
          color={result.accuracy >= 90 ? "text-[#00ff88]" : "text-[#ffd700]"}
        />
        <ResultStat
          label="Correct"
          value={String(result.correctWords)}
          color="text-[#00ff88]"
        />
        <ResultStat
          label="Errors"
          value={String(result.incorrectWords)}
          color={result.incorrectWords > 0 ? "text-[#ff3c3c]" : "text-[#445]"}
        />
        <ResultStat
          label="Duration"
          value={`${result.durationSeconds.toFixed(1)}s`}
          color="text-[#d0d8e8]"
        />
        <ResultStat
          label="Total Words"
          value={String(result.totalWords)}
          color="text-[#d0d8e8]"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={onRetry}
          className="px-8 py-2.5 bg-[#00d4ff] text-[#001520] font-bold font-mono rounded-xl hover:bg-[#33ddff] transition-colors"
        >
          Race Again
        </button>
      </div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div className={`text-3xl font-bold font-mono tabular-nums ${color}`}>
        {value}
      </div>
      <div className="text-xs text-[#445] font-mono uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

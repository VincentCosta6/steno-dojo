import { useState, useEffect, useCallback, useRef } from "react";
import type { WordState, KeyboardDefinition } from "../types";
import { matchesWord, calcWPM, parseStroke } from "../hooks/useSteno";
import { StenoKeyboard } from "./StenoKeyboard";
import { RaceTrack } from "./RaceTrack";
import type { PloverState } from "../hooks/usePlover";
import { getRandomSentence } from "../data/sentences";
import { useStore } from "../store/useStore";

interface PracticeModeProps {
  keyboard: KeyboardDefinition;
  plover: PloverState;
}

export function PracticeMode({ keyboard, plover }: PracticeModeProps) {
  const { settings, lookupStrokes } = useStore();
  const [words, setWords] = useState<WordState[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [_sentenceText, setSentenceText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [flashState, setFlashState] = useState<"none" | "correct" | "wrong">(
    "none"
  );
  const [finished, setFinished] = useState(false);
  const lastStrokeRef = useRef<string>("");
  const wpmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadNewSentence = useCallback(() => {
    const sentence = getRandomSentence(settings.difficulty);
    const rawWords = sentence.text.split(/\s+/).filter(Boolean);
    const wordStates: WordState[] = rawWords.map((w, i) => ({
      word: w,
      status: i === 0 ? "current" : "pending",
      hintStrokes: lookupStrokes(w),
    }));
    setWords(wordStates);
    setSentenceText(sentence.text);
    setCurrentIdx(0);
    setStartTime(null);
    setWpm(0);
    setCorrectCount(0);
    setTotalAttempts(0);
    setFlashState("none");
    setFinished(false);
    lastStrokeRef.current = "";
  }, [settings.difficulty, lookupStrokes]);

  // Load first sentence on mount
  useEffect(() => {
    loadNewSentence();
  }, [loadNewSentence]);

  // Watch for new Plover strokes
  useEffect(() => {
    const { lastStroke, lastTranslation } = plover;
    if (!lastStroke || lastStroke === lastStrokeRef.current) return;
    if (finished || words.length === 0) return;
    lastStrokeRef.current = lastStroke;

    const now = Date.now();
    const current = words[currentIdx];
    if (!current || current.status !== "current") return;

    // Start timer on first stroke
    if (startTime === null) setStartTime(now);

    setTotalAttempts((t) => t + 1);

    const isCorrect = matchesWord(lastTranslation, current.word);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setFlashState("correct");
      setTimeout(() => setFlashState("none"), 350);

      setWords((prev) => {
        const next = [...prev];
        next[currentIdx] = { ...next[currentIdx], status: "correct", usedStroke: lastStroke };
        const nextIdx = currentIdx + 1;
        if (nextIdx < next.length) {
          next[nextIdx] = { ...next[nextIdx], status: "current" };
        }
        return next;
      });

      const nextIdx = currentIdx + 1;
      if (nextIdx >= words.length) {
        setFinished(true);
        if (wpmTimerRef.current) clearInterval(wpmTimerRef.current);
      } else {
        setCurrentIdx(nextIdx);
      }
    } else {
      setFlashState("wrong");
      setTimeout(() => setFlashState("none"), 350);
      setWords((prev) => {
        const next = [...prev];
        next[currentIdx] = { ...next[currentIdx], status: "incorrect" };
        return next;
      });
      setTimeout(() => {
        setWords((prev) => {
          const next = [...prev];
          if (next[currentIdx]) {
            next[currentIdx] = { ...next[currentIdx], status: "current" };
          }
          return next;
        });
      }, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plover.lastStroke]);

  // Live WPM update
  useEffect(() => {
    if (startTime === null) return;
    wpmTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setWpm(calcWPM(correctCount, elapsed));
    }, 500);
    return () => {
      if (wpmTimerRef.current) clearInterval(wpmTimerRef.current);
    };
  }, [startTime, correctCount]);

  // Skip current word
  const skipWord = useCallback(() => {
    setWords((prev) => {
      const next = [...prev];
      if (next[currentIdx]) {
        next[currentIdx] = { ...next[currentIdx], status: "skipped" };
      }
      const nextIdx = currentIdx + 1;
      if (nextIdx < next.length) {
        next[nextIdx] = { ...next[nextIdx], status: "current" };
        setCurrentIdx(nextIdx);
      } else {
        setFinished(true);
      }
      return next;
    });
  }, [currentIdx]);

  const currentWord = words[currentIdx];
  const hintStroke = currentWord?.hintStrokes[0] ?? null;
  const progress = words.length > 0 ? currentIdx / words.length : 0;

  const accuracy =
    totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 100;

  const flashBg =
    flashState === "correct"
      ? "bg-[#003308]"
      : flashState === "wrong"
        ? "bg-[#330000]"
        : "";

  return (
    <div className="flex flex-col h-full gap-4 p-5">
      {/* Race track */}
      <RaceTrack progress={progress} wpm={wpm} />

      {/* Stats bar */}
      <div className="flex gap-4 text-xs font-mono text-[#445]">
        <span>
          Accuracy:{" "}
          <span className={accuracy >= 90 ? "text-[#00ff88]" : "text-[#ffd700]"}>
            {accuracy}%
          </span>
        </span>
        <span>
          Words:{" "}
          <span className="text-[#d0d8e8]">
            {correctCount}/{words.length}
          </span>
        </span>
        <span className="flex-1" />
        <button
          onClick={skipWord}
          disabled={finished}
          className="text-[#334] hover:text-[#00d4ff] transition-colors disabled:opacity-30"
        >
          skip word →
        </button>
        <button
          onClick={loadNewSentence}
          className="text-[#334] hover:text-[#ffd700] transition-colors"
        >
          new sentence ↺
        </button>
      </div>

      {/* Text display */}
      {finished ? (
        <FinishScreen
          wpm={wpm}
          accuracy={accuracy}
          correct={correctCount}
          total={words.length}
          onNext={loadNewSentence}
        />
      ) : (
        <div
          className={`flex-1 rounded-xl border border-[#1a1a3a] p-5 transition-colors duration-150 ${flashBg}`}
        >
          <div className="flex flex-wrap gap-x-3 gap-y-2 leading-loose">
            {words.map((w, i) => (
              <WordChip key={`${w.word}-${i}`} wordState={w} isCurrent={i === currentIdx} />
            ))}
          </div>
        </div>
      )}

      {/* Hint section */}
      {!finished && settings.showHints && (
        <HintBar
          word={currentWord?.word ?? ""}
          stroke={hintStroke}
          allStrokes={currentWord?.hintStrokes ?? []}
        />
      )}

      {/* Keyboard */}
      <StenoKeyboard
        keyboard={keyboard}
        activeKeys={plover.activeKeys}
        hintKeys={
          settings.showHints && hintStroke
            ? parseHintKeys(hintStroke)
            : []
        }
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function WordChip({
  wordState,
  isCurrent,
}: {
  wordState: WordState;
  isCurrent: boolean;
}) {
  const { word, status } = wordState;

  const cls =
    status === "correct"
      ? "text-[#3a5] line-through opacity-60"
      : status === "incorrect"
        ? "text-[#f54] bg-[#330000] px-1 rounded"
        : status === "skipped"
          ? "text-[#445] line-through opacity-50"
          : isCurrent
            ? "text-[#ffd700] font-bold px-1.5 py-0.5 bg-[#221a00] rounded border border-[#443300] underline underline-offset-4 decoration-[#ffd700]/40"
            : "text-[#556]";

  return (
    <span className={`font-mono text-lg transition-all duration-100 ${cls}`}>
      {word}
    </span>
  );
}

function HintBar({
  word,
  stroke,
  allStrokes,
}: {
  word: string;
  stroke: string | null;
  allStrokes: string[];
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#0a0a1e] border border-[#1a1a3a]">
      <span className="text-xs text-[#334] font-mono uppercase tracking-wider">
        Hint
      </span>
      <span className="text-[#d0d8e8] font-mono font-semibold">{word}</span>
      <span className="text-[#334]">→</span>
      {stroke ? (
        <>
          <span className="font-mono text-[#00d4ff] font-bold text-lg tracking-widest">
            {stroke}
          </span>
          {allStrokes.length > 1 && (
            <span className="text-[10px] text-[#334] font-mono">
              +{allStrokes.length - 1} more
            </span>
          )}
        </>
      ) : (
        <span className="text-[10px] text-[#334] font-mono italic">
          not in dictionary — load your Plover main.json in Settings
        </span>
      )}
    </div>
  );
}

function FinishScreen({
  wpm,
  accuracy,
  correct,
  total,
  onNext,
}: {
  wpm: number;
  accuracy: number;
  correct: number;
  total: number;
  onNext: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 rounded-xl border border-[#1a3a1a] bg-[#030e03]">
      <div className="text-5xl">🏁</div>
      <div className="text-2xl font-bold text-[#00ff88] font-mono">
        Sentence Complete!
      </div>
      <div className="grid grid-cols-3 gap-8 text-center">
        <Stat label="WPM" value={String(wpm)} color="text-[#00d4ff]" />
        <Stat label="Accuracy" value={`${accuracy}%`} color={accuracy >= 90 ? "text-[#00ff88]" : "text-[#ffd700]"} />
        <Stat label="Words" value={`${correct}/${total}`} color="text-[#d0d8e8]" />
      </div>
      <button
        onClick={onNext}
        className="px-6 py-2.5 bg-[#00ff88] text-[#001a00] font-bold font-mono rounded-lg hover:bg-[#33ffaa] transition-colors"
      >
        Next Sentence →
      </button>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className={`text-3xl font-bold font-mono tabular-nums ${color}`}>
        {value}
      </div>
      <div className="text-xs text-[#445] font-mono uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}

function parseHintKeys(stroke: string): string[] {
  // Handle multi-stroke (only show first stroke as hint)
  const firstStroke = stroke.split("/")[0];
  return parseStroke(firstStroke);
}

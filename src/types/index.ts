// ─── Keyboard Definition ────────────────────────────────────────────────────

export interface KeyDefinition {
  /** Unique key within this keyboard */
  id: string;
  /** Steno key name: "S-", "T-", "*", "A-", "-E", "#", etc. */
  stenoKey: string;
  /** Text shown on the key face */
  label: string;
  /** 0-indexed CSS grid column */
  col: number;
  /** 0-indexed CSS grid row (0 = number bar row) */
  row: number;
  colSpan?: number;
  rowSpan?: number;
}

export interface KeyboardDefinition {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  url?: string;
  /** Total grid columns */
  gridCols: number;
  /** Total grid rows */
  gridRows: number;
  /** Optional per-row heights (CSS values). Overrides default row sizing. */
  rowHeights?: string[];
  keys: KeyDefinition[];
}

// ─── Plover / Steno ──────────────────────────────────────────────────────────

/** A single steno stroke in RTF/CRE format, e.g. "TEFT" */
export type RTFStroke = string;

/** Parsed active key names from a stroke */
export type StenoKeys = string[];

export interface PloverMessage {
  type: "hello" | "stroked" | "translated" | "machine_state_changed" | "output_state_changed" | string;
  /** Plugin version string, present in "hello" messages */
  version?: string;
  /** RTF/CRE stroke string */
  stroke?: string;
  /** Some plugins use this field name */
  steno?: string;
  /** Translation output text */
  translation?: string;
  text?: string;
  /** Machine connection state (from machine_state_changed) */
  state?: "connected" | "disconnected" | "no connection" | string;
  /** plover-steno-dojo sends the machine name as machine_type */
  machine_type?: string;
  /** Older plugin versions used machine */
  machine?: string;
}

export type PloverStatus = "disconnected" | "connecting" | "connected" | "error";

// ─── Practice / Game ─────────────────────────────────────────────────────────

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface PracticeSentence {
  id: string;
  text: string;
  difficulty: Difficulty;
}

export type WordStatus = "pending" | "current" | "correct" | "incorrect" | "skipped";

export interface WordState {
  word: string;
  status: WordStatus;
  /** Hint strokes for this word */
  hintStrokes: string[];
  /** Stroke the user actually used */
  usedStroke?: string;
}

export type AppMode = "home" | "practice" | "test" | "settings" | "onboarding";

// ─── Test Results ─────────────────────────────────────────────────────────────

export interface TestResult {
  wpm: number;
  accuracy: number;
  correctWords: number;
  incorrectWords: number;
  totalWords: number;
  durationSeconds: number;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  ploverWsUrl: string;
  keyboardId: string;
  dictionaryPath: string;
  difficulty: Difficulty;
  showHints: boolean;
  autoAdvance: boolean;
  onboardingComplete: boolean;
}

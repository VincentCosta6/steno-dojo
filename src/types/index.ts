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

export interface PloverHelloMessage {
  type: "hello";
  version: string;
}

export interface PloverDictionariesMessage {
  type: "dictionaries";
  dictionaries: string[];
}

export interface PloverStrokedMessage {
  type: "stroked" | "stroke";
  stroke?: string | Record<string, string>;
  steno?: string;
  translation?: string;
  text?: string;
}

export interface PloverTranslatedMessage {
  type: "translated";
  translation?: string;
  text?: string;
}

export interface PloverMachineStateMessage {
  type: "machine_state_changed";
  state: "connected" | "disconnected" | "no connection" | string;
  machine_type?: string;
  machine?: string;
}

export interface PloverOutputStateMessage {
  type: "output_state_changed";
}

export type PloverDojoPluginMessage =
  | PloverHelloMessage
  | PloverDictionariesMessage
  | PloverStrokedMessage
  | PloverTranslatedMessage
  | PloverMachineStateMessage
  | PloverOutputStateMessage
  | { type: string; [key: string]: unknown };

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

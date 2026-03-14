import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppMode, AppSettings, Difficulty } from "../types";
import { BUILT_IN_KEYBOARDS } from "../keyboards";

interface StoreState {
  mode: AppMode;
  settings: AppSettings;
  /** Reverse dictionary: word → [strokes] (loaded from Plover main.json) */
  reverseDictionary: Record<string, string[]>;
  /** Custom keyboards loaded from disk at runtime */
  customKeyboards: unknown[];

  setMode: (mode: AppMode) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setReverseDictionary: (dict: Record<string, string[]>) => void;
  addCustomKeyboard: (kb: unknown) => void;
  lookupStrokes: (word: string) => string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  ploverWsUrl: "ws://localhost:8086/",
  keyboardId: BUILT_IN_KEYBOARDS[0].id,
  dictionaryPath: "",
  difficulty: "beginner" as Difficulty,
  showHints: true,
  autoAdvance: true,
  onboardingComplete: false,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      mode: "home",
      settings: DEFAULT_SETTINGS,
      reverseDictionary: {},
      customKeyboards: [],

      setMode: (mode) => set({ mode }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setReverseDictionary: (dict) => set({ reverseDictionary: dict }),

      addCustomKeyboard: (kb) =>
        set((s) => ({ customKeyboards: [...s.customKeyboards, kb] })),

      lookupStrokes: (word: string): string[] => {
        const { reverseDictionary } = get();
        const normalized = word.trim().toLowerCase().replace(/[.,!?;:'"]/g, "");
        return reverseDictionary[normalized] ?? [];
      },
    }),
    {
      name: "steno-dojo-settings",
      // Only persist settings, not the dictionary (too large)
      partialize: (s) => ({ settings: s.settings }),
    }
  )
);

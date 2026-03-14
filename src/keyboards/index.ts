import type { KeyboardDefinition } from "../types";
import ecosteno from "./ecosteno.json";
import geminipr from "./geminipr.json";

export const BUILT_IN_KEYBOARDS: KeyboardDefinition[] = [
  ecosteno as KeyboardDefinition,
  geminipr as KeyboardDefinition,
];

export function getKeyboard(id: string): KeyboardDefinition | undefined {
  return BUILT_IN_KEYBOARDS.find((k) => k.id === id);
}

export { ecosteno, geminipr };

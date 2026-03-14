/**
 * RTF/CRE stroke parsing utilities.
 *
 * Standard key order: # S T K P W H R A O * E U F R P B L G T S D Z
 * Steno key names:    # S- T- K- P- W- H- R- A- O- * -E -U -F -R -P -B -L -G -T -S -D -Z
 */

// Map from index in key order string to steno key name
const KEY_ORDER = "#STKPWHRAO*EUFRPBLGTSDZ";

const INDEX_TO_KEY: Record<number, string> = {
  0: "#",
  1: "S-",
  2: "T-",
  3: "K-",
  4: "P-",
  5: "W-",
  6: "H-",
  7: "R-",
  8: "A-",
  9: "O-",
  10: "*",
  11: "-E",
  12: "-U",
  13: "-F",
  14: "-R",
  15: "-P",
  16: "-B",
  17: "-L",
  18: "-G",
  19: "-T",
  20: "-S",
  21: "-D",
  22: "-Z",
};

// First index of the right bank (after vowels)
const RIGHT_BANK_START = 13; // index of -F

/**
 * Parse an RTF/CRE stroke string into a list of steno key names.
 * e.g. "TEFT" → ["T-", "-E", "-F", "-T"]
 */
export function parseStroke(rtfcre: string): string[] {
  if (!rtfcre || rtfcre === "-") return [];

  const keys: string[] = [];
  let orderPos = 0;

  for (let i = 0; i < rtfcre.length; i++) {
    const ch = rtfcre[i];

    if (ch === "-") {
      // Dash forces us into right-bank territory
      orderPos = Math.max(orderPos, RIGHT_BANK_START);
      continue;
    }

    // E and U after a dash are vowels at positions 11/12 (before right bank start)
    // We handle them specially: if we're already past their positions, they must
    // still be the vowel keys (there's no other E/U in the order)
    if (ch === "E" || ch === "U") {
      const vowelPos = ch === "E" ? 11 : 12;
      const key = INDEX_TO_KEY[vowelPos];
      if (key) keys.push(key);
      // Don't advance orderPos past vowels so subsequent right keys still work
      orderPos = Math.max(orderPos, vowelPos + 1);
      continue;
    }

    // Scan forward in the key order to find this character
    const startPos = orderPos;
    while (orderPos < KEY_ORDER.length && KEY_ORDER[orderPos] !== ch) {
      orderPos++;
    }

    if (orderPos < KEY_ORDER.length) {
      const key = INDEX_TO_KEY[orderPos];
      if (key) keys.push(key);
      orderPos++;
    } else {
      // Character not found ahead — reset to start and try from beginning
      // (shouldn't happen with valid RTF/CRE but be safe)
      orderPos = startPos;
    }
  }

  return keys;
}

/**
 * Format steno keys as a display string.
 * e.g. ["T-", "-E", "-F"] → "T-EF"
 */
export function formatKeys(keys: string[]): string {
  return keys
    .map((k) => {
      if (k === "#") return "#";
      if (k.endsWith("-")) return k.slice(0, -1); // "T-" → "T"
      if (k.startsWith("-")) return k.slice(1); // "-E" → "E"
      return k; // "*"
    })
    .join("");
}

/**
 * Check whether the translated text matches the expected word.
 * Normalizes whitespace and case.
 */
export function matchesWord(translation: string, expected: string): boolean {
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, "");

  return normalize(translation) === normalize(expected);
}

/**
 * Calculate WPM given number of correct words and elapsed milliseconds.
 * Standard WPM = words / (ms / 60000)
 */
export function calcWPM(correctWords: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round(correctWords / minutes);
}

/**
 * Calculate accuracy percentage.
 */
export function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
}

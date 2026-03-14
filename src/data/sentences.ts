import type { PracticeSentence, Difficulty } from "../types";

const SENTENCES: PracticeSentence[] = [
  // ── Beginner ────────────────────────────────────────────────────────────────
  {
    id: "b1",
    difficulty: "beginner",
    text: "the cat sat on the mat",
  },
  {
    id: "b2",
    difficulty: "beginner",
    text: "a big red dog ran fast",
  },
  {
    id: "b3",
    difficulty: "beginner",
    text: "the sun is hot and bright",
  },
  {
    id: "b4",
    difficulty: "beginner",
    text: "I can see the blue sky",
  },
  {
    id: "b5",
    difficulty: "beginner",
    text: "she has a cup of tea",
  },
  {
    id: "b6",
    difficulty: "beginner",
    text: "he ran to the old park",
  },
  {
    id: "b7",
    difficulty: "beginner",
    text: "the boy and the girl played",
  },
  {
    id: "b8",
    difficulty: "beginner",
    text: "we ate lunch at noon",
  },
  {
    id: "b9",
    difficulty: "beginner",
    text: "the fish swam in the lake",
  },
  {
    id: "b10",
    difficulty: "beginner",
    text: "it is a nice day today",
  },

  // ── Intermediate ─────────────────────────────────────────────────────────────
  {
    id: "i1",
    difficulty: "intermediate",
    text: "the quick brown fox jumps over the lazy dog",
  },
  {
    id: "i2",
    difficulty: "intermediate",
    text: "she sells seashells by the seashore",
  },
  {
    id: "i3",
    difficulty: "intermediate",
    text: "how much wood would a woodchuck chuck",
  },
  {
    id: "i4",
    difficulty: "intermediate",
    text: "the early bird catches the worm every morning",
  },
  {
    id: "i5",
    difficulty: "intermediate",
    text: "practice makes perfect when you work every day",
  },
  {
    id: "i6",
    difficulty: "intermediate",
    text: "the court reporter typed at two hundred words per minute",
  },
  {
    id: "i7",
    difficulty: "intermediate",
    text: "stenography is the art of writing in shorthand",
  },
  {
    id: "i8",
    difficulty: "intermediate",
    text: "learning new skills takes dedication and daily practice",
  },
  {
    id: "i9",
    difficulty: "intermediate",
    text: "the defendant entered a plea of not guilty in court",
  },
  {
    id: "i10",
    difficulty: "intermediate",
    text: "please state your name for the record",
  },

  // ── Advanced ─────────────────────────────────────────────────────────────────
  {
    id: "a1",
    difficulty: "advanced",
    text: "the witness testified that she observed the defendant leaving the building at approximately eleven thirty on the night in question",
  },
  {
    id: "a2",
    difficulty: "advanced",
    text: "objection your honor the question calls for speculation and assumes facts not in evidence",
  },
  {
    id: "a3",
    difficulty: "advanced",
    text: "the stockholders voted unanimously to approve the proposed merger subject to regulatory approval",
  },
  {
    id: "a4",
    difficulty: "advanced",
    text: "pursuant to the terms of the agreement the parties hereby agree to submit all disputes to binding arbitration",
  },
  {
    id: "a5",
    difficulty: "advanced",
    text: "the physician recommended a course of physical therapy combined with anti-inflammatory medication and adequate rest",
  },
];

export function getSentences(difficulty?: Difficulty): PracticeSentence[] {
  if (!difficulty) return SENTENCES;
  return SENTENCES.filter((s) => s.difficulty === difficulty);
}

export function getRandomSentence(difficulty?: Difficulty): PracticeSentence {
  const pool = getSentences(difficulty);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomSentences(
  count: number,
  difficulty?: Difficulty
): PracticeSentence[] {
  const pool = getSentences(difficulty);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default SENTENCES;

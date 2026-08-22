import { tokenizeQuranText } from '../verification/quranTextNormalizer';

export interface WordAccuracy {
  expectedCount: number;
  correct: number;
  substituted: number;
  skipped: number;
  added: number;
  /** Correct words over the words that should have been said. */
  accuracy: number;
}

/**
 * Score a transcript against the words that should have been recited. Both sides
 * are normalized first, so Uthmani reference text and Whisper's modern spelling
 * compare as the same word. The alignment is a word-level edit distance, which
 * keeps a single skipped word from marking every later word wrong.
 */
export function scoreTranscript(referenceText: string, transcriptText: string): WordAccuracy {
  const expected = tokenizeQuranText(referenceText);
  const observed = tokenizeQuranText(transcriptText);

  // distance[i][j] holds the edit cost of expected[0..i) against observed[0..j).
  const distance: number[][] = Array.from({ length: expected.length + 1 }, (_, i) =>
    Array.from({ length: observed.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= expected.length; i += 1) {
    for (let j = 1; j <= observed.length; j += 1) {
      const substitutionCost = expected[i - 1] === observed[j - 1] ? 0 : 1;
      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + substitutionCost
      );
    }
  }

  let correct = 0;
  let substituted = 0;
  let skipped = 0;
  let added = 0;
  let i = expected.length;
  let j = observed.length;

  while (i > 0 || j > 0) {
    const substitutionCost =
      i > 0 && j > 0 && expected[i - 1] === observed[j - 1] ? 0 : 1;

    if (i > 0 && j > 0 && distance[i][j] === distance[i - 1][j - 1] + substitutionCost) {
      if (substitutionCost === 0) correct += 1;
      else substituted += 1;
      i -= 1;
      j -= 1;
    } else if (i > 0 && distance[i][j] === distance[i - 1][j] + 1) {
      skipped += 1;
      i -= 1;
    } else {
      added += 1;
      j -= 1;
    }
  }

  return {
    expectedCount: expected.length,
    correct,
    substituted,
    skipped,
    added,
    accuracy: expected.length === 0 ? 0 : correct / expected.length,
  };
}

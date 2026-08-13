import { normalizeQuranText, tokenizeQuranText } from './quranTextNormalizer';
import type { TranscriptMatchResult, VerificationErrorType } from './types';

interface MatchTranscriptInput {
  referenceTokens: string[];
  transcriptText: string;
  expectedIndex?: number;
}

function normalizedReferenceTokens(referenceTokens: string[]): string[] {
  return referenceTokens.flatMap((token) => tokenizeQuranText(token));
}

function levenshteinDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost
      );
    }
    for (let j = 0; j < previous.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
}

function tokenConfidence(observed: string, expected: string): number {
  const longest = Math.max(observed.length, expected.length);
  if (longest === 0) return 1;
  return 1 - levenshteinDistance(observed, expected) / longest;
}

function mismatchResult(
  errorType: VerificationErrorType,
  expectedIndex: number,
  referenceTokens: string[],
  observedTokens: string[],
  observedToken: string
): TranscriptMatchResult {
  const expectedToken = referenceTokens[expectedIndex];
  return {
    status: 'mismatch',
    errorType,
    expectedIndex,
    expectedToken,
    observedToken,
    observedTokens,
    consumedCount: 0,
    confidence: expectedToken ? tokenConfidence(observedToken, expectedToken) : 0,
  };
}

export function matchTranscriptToReference({
  referenceTokens,
  transcriptText,
  expectedIndex = 0,
}: MatchTranscriptInput): TranscriptMatchResult {
  const reference = normalizedReferenceTokens(referenceTokens);
  const observedTokens = tokenizeQuranText(normalizeQuranText(transcriptText));

  if (observedTokens.length === 0) {
    return {
      status: 'incomplete',
      expectedIndex,
      observedTokens,
      consumedCount: 0,
      confidence: 0,
      expectedToken: reference[expectedIndex],
    };
  }

  for (let offset = 0; offset < observedTokens.length; offset += 1) {
    const nextExpectedIndex = expectedIndex + offset;
    const observedToken = observedTokens[offset];
    const expectedToken = reference[nextExpectedIndex];

    if (observedToken === expectedToken) continue;

    if (reference[nextExpectedIndex + 1] === observedToken) {
      return mismatchResult(
        'skipped-word',
        nextExpectedIndex,
        reference,
        observedTokens,
        observedToken
      );
    }

    if (nextExpectedIndex > 0 && reference[nextExpectedIndex - 1] === observedToken) {
      return mismatchResult(
        'repeated-word',
        nextExpectedIndex,
        reference,
        observedTokens,
        observedToken
      );
    }

    return mismatchResult(
      'wrong-word',
      nextExpectedIndex,
      reference,
      observedTokens,
      observedToken
    );
  }

  return {
    status: 'match',
    expectedIndex: expectedIndex + observedTokens.length,
    observedTokens,
    consumedCount: observedTokens.length,
    confidence: 1,
  };
}

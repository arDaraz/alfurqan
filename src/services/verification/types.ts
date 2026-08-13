export interface QuranWordToken {
  text: string;
  normalizedText: string;
  index: number;
  surahNumber?: number;
  ayahNumber?: number;
  wordPosition?: number;
}

export interface TranscriptChunk {
  text: string;
  startedAtMs?: number;
  endedAtMs?: number;
  isFinal?: boolean;
}

export type VerificationMatchStatus = 'match' | 'mismatch' | 'incomplete';
export type VerificationErrorType = 'wrong-word' | 'skipped-word' | 'repeated-word';

export interface TranscriptMatchResult {
  status: VerificationMatchStatus;
  expectedIndex: number;
  observedTokens: string[];
  consumedCount: number;
  confidence: number;
  expectedToken?: string;
  observedToken?: string;
  errorType?: VerificationErrorType;
}

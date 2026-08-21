/**
 * One recognizer output. A partial is replaced as more audio arrives; a final never changes.
 */
export interface AsrTranscript {
  text: string;
  isFinal: boolean;
  /** Groups every transcript that describes the same stretch of speech. */
  segmentIndex: number;
  /** Milliseconds from the moment the source started listening. */
  atMs: number;
}

export interface AsrSourceCallbacks {
  onTranscript: (transcript: AsrTranscript) => void;
  onError: (message: string) => void;
}

/**
 * Speech recognition as the practice engine sees it. The production source is
 * whisper.cpp on the real microphone. Tests inject a scripted source.
 */
export interface AsrSource {
  /** Names the recognizer behind the transcripts, so a session record says what heard it. */
  readonly modelId: string;
  start(callbacks: AsrSourceCallbacks): Promise<void>;
  stop(): Promise<void>;
}

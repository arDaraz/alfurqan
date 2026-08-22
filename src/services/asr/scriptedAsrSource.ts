import type { AsrSource, AsrSourceCallbacks, AsrTranscript } from './types';

export type ScriptedAsrStep = Pick<AsrTranscript, 'text' | 'isFinal'> & {
  segmentIndex?: number;
  /** Milliseconds after the previous step. Zero replays the whole script at once. */
  afterMs?: number;
};

export interface ScriptedAsrSourceOptions {
  modelId?: string;
  script: ScriptedAsrStep[];
}

/**
 * Replays a fixed transcript so a test can drive the practice engine without a
 * microphone or a model. Timing comes from the script, so a test controls it.
 */
export class ScriptedAsrSource implements AsrSource {
  readonly modelId: string;

  private script: ScriptedAsrStep[];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private running = false;

  constructor(options: ScriptedAsrSourceOptions) {
    this.modelId = options.modelId ?? 'scripted';
    this.script = options.script;
  }

  async start(callbacks: AsrSourceCallbacks): Promise<void> {
    if (this.running) return;
    this.running = true;

    let elapsedMs = 0;
    this.script.forEach((step, index) => {
      elapsedMs += step.afterMs ?? 0;
      const atMs = elapsedMs;
      const emit = () => {
        if (!this.running) return;
        callbacks.onTranscript({
          text: step.text,
          isFinal: step.isFinal,
          segmentIndex: step.segmentIndex ?? index,
          atMs,
        });
      };
      if (atMs === 0) {
        emit();
      } else {
        this.timers.push(setTimeout(emit, atMs));
      }
    });
  }

  async stop(): Promise<void> {
    this.running = false;
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}

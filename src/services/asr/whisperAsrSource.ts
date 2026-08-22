import { initWhisper, initWhisperVad } from 'whisper.rn/index';
import { RealtimeTranscriber } from 'whisper.rn/realtime-transcription/RealtimeTranscriber';
import { RingBufferVad } from 'whisper.rn/realtime-transcription/RingBufferVad';
import { AudioPcmStreamAdapter } from 'whisper.rn/realtime-transcription/adapters/AudioPcmStreamAdapter';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn/index';
import type { AudioStreamInterface } from 'whisper.rn/realtime-transcription/types';

import { endAudioRecordingSession, startAudioRecordingSession } from '../audioAdapter';
import type { AsrSource, AsrSourceCallbacks } from './types';

/** What one transcribed segment cost, which is what the model spike measures. */
export interface WhisperSegmentStats {
  segmentIndex: number;
  /** Milliseconds whisper.cpp spent decoding this segment. */
  processTimeMs: number;
  /** Milliseconds of audio the segment covered. */
  recordingTimeMs: number;
  /** Audio buffered in JavaScript. Native model memory is not included. */
  bufferedMB: number;
}

export interface WhisperAsrSourceOptions {
  modelId: string;
  modelPath: string;
  /** Silero model path. Without it every transcript is a partial, because nothing marks the end of speech. */
  vadModelPath?: string;
  /**
   * Where the audio comes from. Defaults to the microphone. The spike screen
   * swaps in a recorded file so the models can be measured on a machine whose
   * microphone is unavailable.
   */
  audioStream?: AudioStreamInterface;
  /** Called for every segment. The spike screen records these; the practice engine ignores them. */
  onSegmentStats?: (stats: WhisperSegmentStats) => void;
}

const SAMPLE_RATE = 16000;

export class WhisperAsrSource implements AsrSource {
  readonly modelId: string;

  private options: WhisperAsrSourceOptions;
  private whisperContext?: WhisperContext;
  private vadContext?: WhisperVadContext;
  private transcriber?: RealtimeTranscriber;
  private startedAtMs = 0;
  private lastSegmentIndex = 0;

  constructor(options: WhisperAsrSourceOptions) {
    this.options = options;
    this.modelId = options.modelId;
  }

  /**
   * A failure anywhere after the session is claimed hands it straight back.
   * Otherwise a model that fails to load would leave the whole app recording,
   * which changes routing and volume for reciter playback with nothing on
   * screen to explain it.
   */
  async start(callbacks: AsrSourceCallbacks): Promise<void> {
    if (this.transcriber) return;

    await startAudioRecordingSession();
    try {
      await this.startListening(callbacks);
    } catch (error) {
      // Whatever went wrong while cleaning up, the caller needs the failure that
      // started it, not the one that happened on the way out.
      await this.stop().catch(() => {});
      throw error;
    }
  }

  private async startListening(callbacks: AsrSourceCallbacks): Promise<void> {
    // Load the two models one after the other. whisper.rn installs its JSI
    // bindings on first use and deletes them off `global` as it binds them, so a
    // second init running concurrently finds every binding missing.
    this.whisperContext = await initWhisper({ filePath: this.options.modelPath });

    let vad: RingBufferVad | undefined;
    if (this.options.vadModelPath) {
      this.vadContext = await initWhisperVad({ filePath: this.options.vadModelPath });
      // whisper.rn sizes this ring buffer as milliseconds times the sample rate,
      // so its default asks for 32 MB and overflows the decoder's stack.
      vad = new RingBufferVad(this.vadContext, {
        vadPreset: 'sensitive',
        sampleRate: SAMPLE_RATE,
        preRecordingBufferMs: 25,
        inferenceIntervalMs: 25,
      });
    }

    this.startedAtMs = Date.now();
    this.lastSegmentIndex = 0;

    this.transcriber = new RealtimeTranscriber(
      {
        whisperContext: this.whisperContext,
        vadContext: vad,
        audioStream: this.options.audioStream ?? new AudioPcmStreamAdapter(),
      },
      {
        audioSliceSec: 30,
        audioStreamConfig: { sampleRate: SAMPLE_RATE, channels: 1, bitsPerSample: 16 },
        transcribeOptions: { language: 'ar', translate: false },
      },
      {
        onTranscribe: (event) => {
          if (event.type !== 'transcribe') return;
          this.lastSegmentIndex = event.sliceIndex;
          const text = event.data?.result?.trim() ?? '';
          this.options.onSegmentStats?.({
            segmentIndex: event.sliceIndex,
            processTimeMs: event.processTime,
            recordingTimeMs: event.recordingTime,
            bufferedMB: event.memoryUsage?.estimatedMB ?? 0,
          });
          if (text) {
            callbacks.onTranscript({
              text,
              isFinal: false,
              segmentIndex: event.sliceIndex,
              atMs: Date.now() - this.startedAtMs,
            });
          }
        },
        onSliceTranscriptionStabilized: (text) => {
          const trimmed = text.trim();
          if (!trimmed) return;
          callbacks.onTranscript({
            text: trimmed,
            isFinal: true,
            segmentIndex: this.lastSegmentIndex,
            atMs: Date.now() - this.startedAtMs,
          });
        },
        onError: callbacks.onError,
      }
    );

    await this.transcriber.start();
  }

  /**
   * Release the microphone and both native contexts. A failure partway through
   * still releases the rest, because a half-stopped source would leave the
   * microphone open with nothing on screen saying so.
   */
  async stop(): Promise<void> {
    const transcriber = this.transcriber;
    const whisperContext = this.whisperContext;
    const vadContext = this.vadContext;
    this.transcriber = undefined;
    this.whisperContext = undefined;
    this.vadContext = undefined;

    const steps = [
      () => transcriber?.stop(),
      () => transcriber?.release(),
      () => whisperContext?.release(),
      () => vadContext?.release(),
      () => endAudioRecordingSession(),
    ];

    let firstFailure: unknown;
    for (const step of steps) {
      try {
        await step();
      } catch (error) {
        firstFailure ??= error;
      }
    }

    if (firstFailure) throw firstFailure;
  }
}

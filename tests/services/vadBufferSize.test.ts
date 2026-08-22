import { RingBufferVad } from 'whisper.rn/realtime-transcription/RingBufferVad';

/** Runs whisper.rn's own ring buffer, so a release that changes its sizing fails here. */

const SAMPLE_RATE = 16000;
const AUDIO_SLICE_SEC = 30;
const BYTES_PER_SLICE = AUDIO_SLICE_SEC * SAMPLE_RATE * 2;

function ringCapacityFor(preRecordingBufferMs: number): number {
  const vad = new RingBufferVad({ detectSpeechData: jest.fn() } as never, {
    sampleRate: SAMPLE_RATE,
    preRecordingBufferMs,
    inferenceIntervalMs: Math.min(preRecordingBufferMs, 25),
  });
  // The ring is private, so size it by writing more than a slice and reading back.
  const ring = (vad as unknown as { ringBuffer: { write: (d: Uint8Array) => void; read: () => Uint8Array } })
    .ringBuffer;
  ring.write(new Uint8Array(BYTES_PER_SLICE * 2));
  return ring.read().length;
}

describe('whisper.rn VAD ring buffer', () => {
  it('overflows a slice at the library default', () => {
    expect(ringCapacityFor(1000)).toBeGreaterThan(BYTES_PER_SLICE);
  });

  it('stays inside a slice at the value this app passes', () => {
    expect(ringCapacityFor(25)).toBeLessThanOrEqual(BYTES_PER_SLICE);
  });
});

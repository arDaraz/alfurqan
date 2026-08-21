import { ScriptedAsrSource } from '../scriptedAsrSource';
import type { AsrSource, AsrTranscript } from '../types';

function collect(source: AsrSource) {
  const transcripts: AsrTranscript[] = [];
  const errors: string[] = [];
  return {
    transcripts,
    errors,
    callbacks: {
      onTranscript: (t: AsrTranscript) => transcripts.push(t),
      onError: (message: string) => errors.push(message),
    },
  };
}

describe('ScriptedAsrSource', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('satisfies the ASR source interface the practice engine consumes', async () => {
    const source: AsrSource = new ScriptedAsrSource({ script: [] });

    expect(source.modelId).toBe('scripted');
    await expect(source.start({ onTranscript: () => {}, onError: () => {} })).resolves.toBeUndefined();
    await expect(source.stop()).resolves.toBeUndefined();
  });

  it('replays the script in order with the timing it declares', async () => {
    const source = new ScriptedAsrSource({
      script: [
        { text: 'الحمد', isFinal: false },
        { text: 'الحمد لله', isFinal: false, afterMs: 300 },
        { text: 'الحمد لله رب العالمين', isFinal: true, afterMs: 400 },
      ],
    });
    const sink = collect(source);

    await source.start(sink.callbacks);
    expect(sink.transcripts).toHaveLength(1);

    jest.advanceTimersByTime(300);
    expect(sink.transcripts).toHaveLength(2);

    jest.advanceTimersByTime(400);
    expect(sink.transcripts.map((t) => [t.text, t.isFinal, t.atMs])).toEqual([
      ['الحمد', false, 0],
      ['الحمد لله', false, 300],
      ['الحمد لله رب العالمين', true, 700],
    ]);
  });

  it('emits nothing more once stopped', async () => {
    const source = new ScriptedAsrSource({
      script: [{ text: 'الحمد', isFinal: true, afterMs: 100 }],
    });
    const sink = collect(source);

    await source.start(sink.callbacks);
    await source.stop();
    jest.advanceTimersByTime(1000);

    expect(sink.transcripts).toHaveLength(0);
  });
});

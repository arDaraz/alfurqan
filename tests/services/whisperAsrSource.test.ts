const mockInitWhisper = jest.fn();
const mockInitWhisperVad = jest.fn();
const mockRingBufferVadConstructor = jest.fn();
const mockTranscriberStart = jest.fn();
const mockStartAudioRecordingSession = jest.fn();

jest.mock('whisper.rn/index', () => ({
  initWhisper: (...args: unknown[]) => mockInitWhisper(...args),
  initWhisperVad: (...args: unknown[]) => mockInitWhisperVad(...args),
}));

jest.mock('whisper.rn/realtime-transcription/RingBufferVad', () => ({
  RingBufferVad: class {
    constructor(...args: unknown[]) {
      mockRingBufferVadConstructor(...args);
    }
  },
}));

jest.mock('whisper.rn/realtime-transcription/RealtimeTranscriber', () => ({
  RealtimeTranscriber: jest.fn().mockImplementation(() => ({
    start: mockTranscriberStart,
  })),
}));

jest.mock('whisper.rn/realtime-transcription/adapters/AudioPcmStreamAdapter', () => ({
  AudioPcmStreamAdapter: jest.fn(),
}));

jest.mock('../../src/services/audioAdapter', () => ({
  startAudioRecordingSession: () => mockStartAudioRecordingSession(),
  endAudioRecordingSession: jest.fn(),
}));

import { WhisperAsrSource } from '../../src/services/asr/whisperAsrSource';

describe('WhisperAsrSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitWhisper.mockResolvedValue({ release: jest.fn() });
    mockInitWhisperVad.mockResolvedValue({ release: jest.fn() });
    mockStartAudioRecordingSession.mockResolvedValue(undefined);
    mockTranscriberStart.mockResolvedValue(undefined);
  });

  it('caps the whisper.rn VAD buffer below one audio slice', async () => {
    const source = new WhisperAsrSource({
      modelId: 'quran',
      modelPath: '/models/quran.bin',
      vadModelPath: '/models/vad.bin',
    });

    await source.start({ onTranscript: jest.fn(), onError: jest.fn() });

    expect(mockRingBufferVadConstructor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sampleRate: 16000,
        preRecordingBufferMs: 25,
        inferenceIntervalMs: 25,
      })
    );
  });
});

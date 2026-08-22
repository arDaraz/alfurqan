/**
 * A model is either published, in which case it downloads and its size is
 * verified, or it has no trusted build and has to be put on the device by hand.
 */
export type AsrModel = {
  id: string;
  /** Shown on the spike screen and written into every measurement row. */
  label: string;
  fileName: string;
} & (
  | { url: string; sizeBytes: number }
  | { url?: undefined; sizeBytes?: undefined }
);

/**
 * The two candidates the spike compares: stock multilingual Whisper against a
 * Whisper retrained on Quran recitation. Both are the `base` architecture at f16
 * so the comparison isolates the training data.
 */
export const ASR_MODELS: AsrModel[] = [
  {
    id: 'whisper-base',
    label: 'Whisper base (general)',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    fileName: 'ggml-base.bin',
    sizeBytes: 147_951_465,
  },
  {
    // No trusted ggml build of tarteel-ai/whisper-base-ar-quran is published: the
    // one mirror on Hugging Face does not match a clean conversion of the official
    // weights and crashes whisper.cpp on load. Convert the official weights with
    // whisper.cpp's models/convert-h5-to-ggml.py and copy the result onto the
    // device until the project publishes its own build.
    id: 'whisper-base-ar-quran',
    label: 'Whisper base (Quran-retrained)',
    fileName: 'ggml-base-ar-quran-f16.bin',
  },
];

/**
 * Silero voice activity detection. It marks where speech starts and stops, which
 * is what turns a stream of partials into segments the engine can call final.
 */
export const VAD_MODEL: AsrModel = {
  id: 'silero-v5.1.2',
  label: 'Silero VAD',
  url: 'https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v5.1.2.bin',
  fileName: 'ggml-silero-v5.1.2.bin',
  sizeBytes: 885_098,
};

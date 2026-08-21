# Whisper spike with the real microphone (issue #21)

Go/no-go gate for the memorization engine (issue #19). The question this spike
answers: does on-device Whisper follow Quran recitation well enough to build the
practice engine on, and which model ships.

**Result: go, with the Quran-retrained model.** Numbers are in the Measurements
section below.

## What was built

Production code the practice engine will consume:

- `src/services/asr/types.ts` - the narrow ASR-source interface. Three members:
  `modelId`, `start(callbacks)`, `stop()`. Callbacks receive `AsrTranscript`
  (`text`, `isFinal`, `segmentIndex`, `atMs`) and errors.
- `src/services/asr/whisperAsrSource.ts` - the real path. whisper.cpp through
  `whisper.rn`, microphone through `@fugood/react-native-audio-pcm-stream`,
  speech boundaries through Silero VAD. 16 kHz mono.
- `src/services/asr/scriptedAsrSource.ts` - the scripted implementation the
  acceptance criteria require. Replays a fixed transcript on fake timers, so an
  engine test needs no microphone and no model.
- `src/services/asr/modelStore.ts` - downloads a ggml model into the app's
  document directory, resumable, with a size check so a truncated file is never
  handed to whisper.cpp.
- `src/services/asr/models.ts` - the two spike candidates and the VAD model.
- `src/services/asr/wordAccuracy.ts` - word-level edit distance between a
  transcript and the expected text, reusing the existing Quran normalizer.
- `src/services/audioAdapter.ts` - two new functions,
  `startAudioRecordingSession` and `endAudioRecordingSession`.

Throwaway:

- `src/app/dev/asr-spike.tsx` - the developer test screen. Reachable from
  Settings > Developer, which only renders under `__DEV__`.

## Decisions

**Reused the existing normalizer instead of writing one.**
`src/services/verification/quranTextNormalizer.ts` already folds alef variants,
strips tashkeel and Quranic marks, and drops non-Arabic characters. That is
exactly what is needed to compare Whisper's modern spelling against Uthmani
reference text, so `wordAccuracy.ts` calls `tokenizeQuranText` rather than
adding a second normalizer.

**Reused expo-audio for the microphone permission.** `expo-audio` is already a
dependency. Its config plugin writes `NSMicrophoneUsageDescription` and the
Android `RECORD_AUDIO` permission, and it exports
`getRecordingPermissionsAsync` / `requestRecordingPermissionsAsync`. No new
permission code was written.

**Kept VAD in scope even though the acceptance criteria do not ask for it.**
Without a VAD context, `RealtimeTranscriber` only ever emits partials; nothing
marks the end of speech. The practice engine's design in issue #19 needs a slow
lane that commits errors from final segments only, so a source that never
reports a final would have to be rewired immediately. The VAD model is 885 KB,
so the cost is small.

**Deep import paths for whisper.rn.** The package's `exports` map has no `"."`
entry and no `adapters/index`, so `import ... from 'whisper.rn'` does not
resolve. Every import names the file: `whisper.rn/index`,
`whisper.rn/realtime-transcription/RealtimeTranscriber`, and so on.

**The audio session has to be claimed before the microphone opens.** The app
configures the session for playback with `allowsRecording: false`. Under that
category iOS refuses to start an input queue: the log shows
`AudioQueueStartWithFlags: <-(err=-66628)` and the converter reads zero bytes.
`startAudioRecordingSession` switches the session to `allowsRecording: true` and
`stop()` hands it back. That also implements the interaction issue #19 asks for,
where practice takes the audio route from playback and returns it afterwards.

**whisper.rn's models have to be loaded one at a time.** Loading the Whisper
context and the VAD context with `Promise.all` breaks both. `installJsi` runs on
first use, binds every JSI function off `global`, and deletes each one as it
binds it. A second init running concurrently finds `isJsiInstalled` still false
and every binding already gone, so it throws
`[RNWhisper] Missing JSI bindings: whisperGetConstants, whisperInitContext, ...`.
The sequential load is deliberate; the comment in `startListening` says so.

**The audio source is injectable.** `WhisperAsrSourceOptions.audioStream`
defaults to the microphone. The spike screen substitutes whisper.rn's
`SimulateFileAudioStreamAdapter` so the models could be measured on a machine
with no working microphone; see the limits section.

## Model provenance and the conversion

The general candidate is the official `ggml-base.bin` from `ggerganov/whisper.cpp`
on Hugging Face: f16, 147,951,465 bytes.

The Quran-retrained candidate is `tarteel-ai/whisper-base-ar-quran`, published
only as PyTorch weights, so a ggml conversion is required. Two problems came up.

**1. The published mirror is not trustworthy.** The only ggml mirror on Hugging
Face, `B1uqa/whisper-base-ar-quran-ggml/ggml-base-ar-quran.bin`, is 290,961,642
bytes with sha256
`8c58efae1398817bdf1f99e99a985d85f7fd047d5dfa0eb4443d1f7441a51141`. A clean f32
conversion of the official weights is 290,960,233 bytes, sha256
`0eb1ab2160fe4bc49191c98c952b79878aa92fc5227f50757b392c62e9a617a1`. The mirror
is 1,409 bytes larger and the hashes differ, so it is not the official weights.
Loading it crashed the app outright.

**2. The conversion script writes the wrong context length.** whisper.cpp's
`models/convert-h5-to-ggml.py` copies `n_text_ctx` from the Hugging Face
config's `max_length`, which tarteel set to 1024. Whisper's decoder uses 448, so
whisper.cpp rejects the file with `Failed to load the model` even though every
tensor already has the right shape. Patching that one header field at byte
offset 24 makes the file load.

The model that produced the measurements below:

```
ggml-base-ar-quran-f16.bin  147,951,465 bytes
sha256 aaebca10e2a65a6dda073a6b3ac59900f91887628acf872c565a0198ee850ead
```

Reproduce it with `convert-h5-to-ggml.py` against `tarteel-ai/whisper-base-ar-quran`,
then set `n_text_ctx` to 448.

Because no build we trust is published, `AsrModel.url` is now optional and the
Quran entry has none. `ensureModel` throws a message naming the file when it is
missing. **The project has to publish its own converted build before this ships.**

## Measurements

iOS Simulator, iPhone 17 Pro, iOS 26.5, Apple Silicon host. Al-Fatiha recited by
Mahmoud Khalil Al-Husary, 47.6 s, 16 kHz mono. Both models are `base` at f16 and
ran through an identical procedure.

| | Whisper base (general) | Whisper base (Quran-retrained) |
| --- | --- | --- |
| Model size | 148 MB | 148 MB |
| First transcript | 1994 ms | 2068 ms |
| Segments transcribed | 73 | 98 |
| Decode time, median | 533 ms | 513 ms |
| Decode time, worst | 3086 ms | 976 ms |
| Realtime factor (decode / audio) | 0.07 | 0.04 |
| Peak audio buffered | 2.25 MB | 2.25 MB |
| Committed-transcript accuracy | 0% (0 / 29 words) | 41% (12 / 29 words) |
| Wrong / skipped / extra words | 0 / 29 / 0 | 3 / 14 / 0 |

What the transcripts actually looked like matters more than the accuracy column.

General model, committed transcript:
`Bismillahi r-Rahmanir r-Rahim. Alhamdulillahir Abbi l-Alamin. Al-Rahmanir r-Rahim. MALI ki Yumiddin.`
Its live lane later switched to Arabic and mangled it:
`لكى تقيم صيراط الذين أن عمت عام`.
So the general model romanizes Quranic recitation, flips script mid-session, and
when it does write Arabic it produces words the matcher cannot key on. Word-level
matching against the mushaf is impossible with it. Its 0% is real, not a scoring
artifact.

Quran-retrained model, committed transcript:
`ف ال حمدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينَ`
Its live lane on the last ayah:
`صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ`
Arabic with full tashkeel, correct words. The 41% is bounded by the committed
lane, not by the model: only VAD-final segments commit, the basmala came out as
`ف ال` at the very start, and the session was stopped before the last ayahs
committed. The 14 "skipped" words are words that never reached the committed lane.

Decision: **the Quran-retrained model ships.** It is the same size, decodes
faster in the worst case (976 ms against 3086 ms), and is the only one of the
two that writes the script the matcher needs.

## Test environment limits

Recorded here because they bound what the measurements prove.

- **The host microphone is unusable on this machine.** macOS denies microphone
  access process-wide: `sox -d` records three seconds of pure silence, maximum
  amplitude 0.000000, for the terminal as well as for the Simulator. Nothing
  here can capture live audio until someone grants Microphone permission in
  System Settings. The in-app path was verified up to that boundary: the iOS
  permission prompt appears with our usage string, permission is granted, the
  session switches to `allowsRecording: true`, and whisper.cpp opens a 16 kHz
  mono input queue. Only the host input is silent.
- **The measurements therefore come from a recorded WAV** fed through the same
  `RealtimeTranscriber`, the same VAD, and the same decode path. Everything
  after audio capture is identical to the microphone path.
- **No Android device or emulator on this machine.** There is no Android SDK
  installed and no physical device attached, so nothing Android could be run.
  The configuration half was checked without a device:
  `npx expo prebuild --platform android` puts
  `<uses-permission android:name="android.permission.RECORD_AUDIO"/>` in the
  generated manifest, and both `whisper.rn` and
  `@fugood/react-native-audio-pcm-stream` ship `android/build.gradle`, so they
  autolink. Compiling and running still needs the SDK and a device.
- **No physical iPhone attached.** The Simulator runs whisper.cpp on the Mac's
  CPU and GPU, so decode times will be faster than a real iPhone. The accuracy
  and script findings do not depend on the host and carry over.

## Deferred

Raised by the review passes, not fixed here, with the reason.

- **The audio session mode has no owner.** `startAudioRecordingSession` and
  `endAudioRecordingSession` write past `audioAdapter`'s own `setupPromise` and
  keep no count. That is fine while one thing listens at a time. The practice
  engine will play the reciter while listening, and then the first `end` call
  closes the microphone for whoever is still using it. Give the session mode a
  single owner when that phase lands.
- **`modelStore` repeats the download-and-verify shape of `ayahAudioCache`.**
  About eight lines: the document-directory guard and the size check. Left
  duplicated because pointing a speech-model store at an audio cache module is a
  worse dependency than the duplication, and a shared file helper for two callers
  is an abstraction neither has asked for yet.
- **`scoreTranscript` and `tasmeeaMatcher` both decide what a skipped word is.**
  They cannot be merged as they stand: the matcher does character-level distance
  with no traceback, `wordAccuracy` needs word-level with one. Pick the survivor
  when the practice engine lands and delete the other.
- **`type()` in the spike screen fixes a repo-wide duplication in the one file
  marked for deletion.** `fontSize` plus `size * lineHeight` is written by hand
  in `MushafLayoutPicker`, `MushafReader.web`, `PlayerSheet` and others.
  `theme.ts` should hand back applied styles; that is a separate change.
- **`scoreTranscript` rebuilds the whole edit-distance matrix per committed
  segment.** Noise for Al-Fatiha's 29 words. A full surah would build a matrix of
  millions of cells on the JS thread, so the engine needs incremental scoring.

## Verification

- `npm test` - 313 tests pass across 58 suites.
- `npx tsc --noEmit` - clean.
- `npm run lint` - no errors.
- Both models were run on the iOS Simulator and recorded on video. Recordings
  and result screenshots are in the session scratch directory and are referenced
  from the comment on issue #21; they are not committed.

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
| Decode time, median | 529 to 533 ms | 514 to 570 ms |
| Decode time, worst | 3086 to 3679 ms | 970 to 1171 ms |
| Realtime factor (decode / audio) | 0.07 | 0.04 |
| Peak audio buffered in JavaScript | 2.25 MB | 2.25 MB |
| App resident memory, before the model loads | 794 MB | 800 MB |
| App resident memory, peak while listening | 1237 MB | 1268 MB |
| Growth attributable to the model and decode | 443 MB | 468 MB |
| Committed-transcript accuracy | 0% (0 / 29 words) | 69% to 72% (20 to 21 / 29 words) |
| Wrong / skipped / extra words | 0 / 29 / 0 | 5 / 4 / 0 |

Resident memory is the whole app measured on the host with `ps -o rss=`, because
a Simulator app is a host process. It therefore includes the Qur'an database, the
JavaScript bundle and the UI, and it will not match a real phone. The growth row
is the useful figure: both models cost about the same, which is what two f16
builds of the same architecture should do.

What the transcripts actually looked like matters more than the accuracy column.

General model, committed transcript:
`Bismillahi r-Rahmanir r-Rahim. Alhamdulillahir Abbi l-Alamin. Al-Rahmanir r-Rahim. MALI ki Yumiddin.`
Its live lane later switched to Arabic and mangled it:
`لكى تقيم صيراط الذين أن عمت عام`.
So the general model romanizes Quranic recitation, flips script mid-session, and
when it does write Arabic it produces words the matcher cannot key on. Word-level
matching against the mushaf is impossible with it. Its 0% is real, not a scoring
artifact.

Ranges come from repeated runs. Accuracy was measured three times on the Quran
model: 69% and 72% on runs left to play the recording out, and 41% on an earlier
run stopped before the last segments committed. The figure is 69% to 72%; the 41%
measured a truncated session, not the model. An earlier revision of this file and
of the issue comment published that 41% and has been corrected.

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

## Android

The Android half was previously untested. It now builds and runs.

**The build works.** `./gradlew assembleDebug` succeeds in 11m 49s with NDK 27
and CMake 3.22, and the APK carries `librnwhisper.so` for every ABI:
`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`, plus the CPU variants
`librnwhisper_v8.so`, `librnwhisper_v8fp16_va_2.so`, `librnwhisper_vfpv4.so` and
`librnwhisper_x86_64.so`. whisper.cpp compiles for Android without changes.

**The microphone permission works.** Tapping Start on a running Android device
raises the system prompt `Allow Al Furqan to record audio?`, and granting it lets
the session start. That is the Android half of the permission criterion, observed
on screen rather than inferred from the manifest.

**Whisper transcribes Arabic on Android.** The Quran-retrained model produced
`بِسْمِ اللَّهِ الرَّجْع` from the recorded Al-Fatiha.

Measured on the emulator, Pixel 9 profile, Android 16, arm64, software GPU:

| | iOS Simulator | Android emulator |
| --- | --- | --- |
| First transcript | 2034 ms | 10827 ms |
| Segments transcribed | 98 | 7 |
| Decode time, median | 514 ms | 9349 ms |
| Decode time, worst | 986 ms | 23530 ms |
| Realtime factor | 0.04 | 2.92 |
| Peak audio buffered | 2.25 MB | 0.78 MB |
| Accuracy | 69% to 72% | 7% (2 / 29) |

**A realtime factor of 2.92 means decoding takes nearly three times as long as
the audio it covers**, so the recognizer falls further behind every second. The
accuracy figure follows: only 7 slices were transcribed before the session ended,
so most of the surah never reached the matcher.

An earlier revision of this file blamed that on emulated CPU. That was wrong. The
emulator runs **native arm64 under the hypervisor**, not instruction emulation.
`/proc/cpuinfo` on the device reports `arm64-v8a` across 4 cores with
`fp asimd asimddp fphp asimdhp bf16`, which are the same SIMD features whisper.cpp
uses on a phone. So slow instruction emulation does not explain 2.92.

**The two platforms do not use the same compute backend.** That is most of the
gap. `whisper.rn`'s iOS source compiles under `WSP_GGML_USE_METAL` and sets
`params.use_gpu = options.useGpu`, which defaults to true, so iOS decoded on the
GPU through Metal. Its Android `CMakeLists.txt` sets no GPU flag at all, so
Android decoded on the CPU only. A GPU-versus-CPU comparison explains a gap of
this size far better than core count does.

Two consequences, and both matter more than the raw numbers:

1. **The iOS and Android rows are not comparable.** Do not read the table as
   "Android is 73 times slower than iOS". It says a Mac GPU beat four virtualised
   CPU cores.
2. **The iOS numbers are optimistic for a phone too.** They came from Metal on a
   Mac's GPU, which is far stronger than an iPhone's. A real iPhone will also use
   Metal, so the shape carries over, but the magnitude will not.

Still unaccounted for beyond the backend difference: four cores against a phone's
six or eight, host contention on this Mac, and the RangeError below, which appears
to drop slices and would inflate per-slice figures. **Re-measure both platforms on
real hardware before drawing any throughput conclusion.** Whether Android should
enable a GPU backend at all is a question for the practice engine phase.

**The Android decode figures come from survivors only.** logcat for that session
shows 10 completed native jobs (`job::~job`), 3 RangeErrors, and the screen
reported 7 segments. 10 minus 3 is exactly 7, so every RangeError destroys one
finished transcription before it reaches JavaScript. The native decode never
failed. That means the Android median and worst decode times were computed from
the 7 that survived, and the accuracy figure is low partly because three slices
of text were thrown away rather than because the model misheard them. Treat the
whole Android row as provisional until the error is fixed.

**A RangeError in whisper.rn eats one transcription each time.** Three times
during the run, roughly once per transcription, logcat shows:

```
E ReactNativeJS: [Error: Uncaught (in promise, id: N) RangeError: Maximum call stack size exceeded]
```

The symbolicated stack, read off LogBox on the device, names the fault exactly:

```
cleanupOldSlices   SliceManager.ts:170:27
getCurrentSlice    SliceManager.ts:85:28
addAudioData       SliceManager.ts:33:46
addAudioData       SliceManager.ts:43:31
addAudioData       SliceManager.ts:43:31   (repeats to stack exhaustion)
```

Two bugs in `whisper.rn` combine to cause the failure. The first is a units bug
in `RingBufferVad.ts:80`:

```js
const bufferSize = Math.floor(preRecordingBufferMs * sampleRate * 2)
```

`preRecordingBufferMs` is milliseconds, but the calculation treats it as
seconds. The default therefore allocates `1000 * 16000 * 2 = 32,000,000` bytes
instead of the intended 32,000 bytes. The sibling calculation at line 83 uses
the correct conversion: `(inferenceIntervalMs / 1000) * sampleRate * 2`.

The oversized ring buffer does not wrap during an ordinary session, so
`RingBuffer.read()` returns everything written so far. Once that VAD context
exceeds the 960,000-byte audio slice, a speech-start event passes a chunk that no
fresh slice can hold. The second bug is in `SliceManager.ts:43`, where
`addAudioData` recurses into itself rather than consuming the input in a loop:

```js
if (currentSlice.sampleCount + audioData.length > bytesPerSlice) {
  this.finalizeCurrentSlice()
  this.currentSliceIndex += 1
  return this.addAudioData(audioData) // line 43
}
```

That terminates only when the next slice can hold the unchanged chunk. A chunk
larger than one slice therefore recurses until the stack dies. This is a
production-path defect because the microphone path also uses `RingBufferVad`.

The app applies a temporary option-only workaround in `WhisperAsrSource`:

- `preRecordingBufferMs: 25`
- `inferenceIntervalMs: 25`

The library guard rejects only `preRecordingBufferMs < inferenceIntervalMs`, so
equality is valid. With the library's faulty arithmetic, the ring is capped at
`25 * 16000 * 2 = 800,000` bytes, below the 960,000-byte slice. It still holds
25 seconds of real pre-roll rather than the intended one second.

The configured inference threshold falls from 16,000 bytes to 800 bytes, but
`RingBufferVad` can enqueue at most one inference per source callback. The file
adapter sends 3,200 bytes every 100 ms, so the actual scheduling ceiling rises
from 2 to 10 calls per audio second, not 40. The CPU could not keep up with that
queue. Six instrumented calls completed during the 47.64-second candidate run.
They ranged from 43 to 36,336 ms, with a 157.5 ms median and 7,021 ms mean. Their
42,126 ms total is 884 ms of completed VAD work per second of input audio.

In matched silent microphone windows, where the production adapter sends one
16,384-byte callback about every 512 ms, the default settings spent 39,411 ms
across 12 native VAD calls. The workaround spent 41,382 ms across 13 calls, a
5.0% rise in total native VAD time. The workaround also stopped the VAD input
from growing past 800,000 bytes.

`RingBufferVad.ts:226` also uses `preRecordingBufferMs` as a millisecond timing
offset. Changing 1000 to 25 moves its internal speech-start and silence clocks
by 975 ms for the same detected speech offset. The app's observed first
transcript moved from 10,827 ms in the earlier Android baseline to 13,100 ms in
the workaround run, 2,273 ms later. That arrival time also includes the VAD
queue and Whisper decoding, so it does not isolate the 975 ms clock change.

A final uninstrumented 47.64-second recorded-audio run completed seven native
jobs with zero `RangeError`s. The screen displayed six transcribed segments, so
the run removed the stack overflow but did not meet a strict one-segment-per-job
criterion.

Ruled out while narrowing it, recorded so nobody repeats the work:

- The file adapter emits `0.1 * bytesPerSecond`, 3,200 bytes, against a 960,000
  byte slice. The oversized chunk is the accumulated VAD context, not a source
  audio callback.
- `maxSlicesInMemory` is correctly defaulted to 3 at `RealtimeTranscriber.ts:132`,
  so `SliceManager`'s own default of 1 never applies.
- `bytesPerSlice` is computed identically in `addAudioData` and `getCurrentSlice`,
  so the two do not disagree.
- `sampleRate` is not passed to the `SliceManager` constructor and falls back to
  16000, which matches what this app configures.

The permanent fix belongs upstream. `RingBufferVad` must divide
`preRecordingBufferMs` by 1000, and `SliceManager.addAudioData` must consume large
chunks iteratively with a progress guard. Do not patch `node_modules`. The app
workaround should be removed after a fixed `whisper.rn` release is adopted. iOS
cannot be assumed clean, only unmeasured.

## The fix is verified on the file path, not the microphone path

The `preRecordingBufferMs` workaround was confirmed on the recorded-audio path: a
47.64 second Android run produced zero RangeErrors, against 3 in the equivalent
run before it.

The microphone path could not be confirmed. The emulator was rebooted with audio
enabled, the host input was set to the one device on this Mac that does capture,
and Al-Fatiha was played twice through the speakers. The session ran and stopped
cleanly, but `job::~job` was 0, meaning no audio ever reached whisper. That is an
inconclusive result, not a pass: with no audio there is nothing for the ring
buffer to overflow with, so zero RangeErrors proves nothing.

So neither simulator on this machine captures audio, and the Android side was
tried twice. The iOS Simulator refuses at `AudioQueueStartWithFlags`. The Android
emulator accepts the recording and delivers silence, both on the default audio
backend and on `-audio coreaudio`, with `-no-audio` removed and the host input set
to the one device that does capture. `job::~job` stayed 0 in every attempt.

Do not spend more time on emulator audio. Three routes are closed.

The fix should still hold on the microphone path, because the overflow came from
VAD ring-buffer accumulation measured in elapsed audio rather than from the
source's chunk size, and the cap applies the same way to both. That is reasoning,
not evidence. **Confirm it on a real device.**

One thing the file-path run did not fully settle: 7 native jobs produced 6
displayed segments. Zero stack overflows, but one result still went missing
through some other route. Worth watching on the first real-device run.

## Test environment limits

Recorded here because they bound what the measurements prove.

- **The iOS Simulator cannot capture audio here; the host microphone can.** An
  earlier revision of this file claimed macOS denied the microphone
  process-wide. That was wrong, and it was wrong because only the default input
  device was tested. Testing all three inputs shows the built-in MacBook
  microphone and the Krisp virtual device record silence at -91 dB, while the
  `4K SlimFit Cam` USB input records real signal at -4.3 dB, 0.59 peak amplitude.

  With that device set as the system input, the Simulator still captures nothing.
  `AudioQueueStartWithFlags` returns -66628 on every attempt and the converter
  reports `AudioConverterFillComplexBuffer returned -50` with zero bytes. That
  does not change when the input device changes, when the simulator is shut down
  and rebooted, or when the device runs under `Simulator.app` rather than
  headless. `Simulator` never appears in System Settings > Privacy & Security >
  Microphone, so it never asks for the permission in the first place.

  Read that as the Simulator not offering audio input in this environment, not as
  a defect in the app. Everything the app controls works: the iOS permission
  prompt appears with our usage string, permission is granted, the session
  switches to `allowsRecording: true`, and whisper.cpp opens a 16 kHz mono input
  queue. **The live microphone path needs a real iPhone**, which is the same
  hardware the device-matrix criteria need.
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

## A note on driving this screen

Taps aimed at coordinates read off a screenshot miss often enough to look like
broken buttons. Two testers reported exactly that: a chip selecting the wrong
model, chip taps that did nothing, and Record run appearing to navigate away or
do nothing.

None of it is a defect in the screen. Every one of those reports came from
tapping a coordinate that was not where the element actually sat. The
accessibility tree reports an element's position inside the scroll content, so
Record run sits at y=1425 while the screen is only 874 points tall; tapping 1425
lands nowhere. Re-tested by finding each element in the tree, scrolling it into
the viewport, tapping its centre, and confirming the change:

- Model chips: 5 of 5 alternating taps selected the right model, confirmed by the
  `Selected` trait on the chip.
- Record run: the counter went 0, 1, 2 and the screen never navigated away.
- Start and Stop: the status line went from `Listening to fatiha-16k.wav.` to
  `Stopped. Numbers below cover the whole session.`
- The model-missing path: with `ggml-base-ar-quran-f16.bin` absent, Start shows
  `Could not start listening: Whisper base (Quran-retrained) has no published
  build. Put ggml-base-ar-quran-f16.bin in the app's asr-models directory.` and
  the screen stays usable.

To drive this screen, find elements by label in `idb ui describe-all`, scroll them
into the viewport, and verify each tap by re-reading the tree. Do not report a
missed tap as a broken button.

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

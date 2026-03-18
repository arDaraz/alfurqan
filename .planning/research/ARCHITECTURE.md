# Architecture Research

**Domain:** Quran memorization mobile app with on-device speech recognition
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH

## System Overview

```
+------------------------------------------------------------------+
|                     PRESENTATION LAYER                            |
|  +------------+  +------------+  +-----------+  +-----------+    |
|  | Recitation |  |  Quran     |  | Progress  |  | Session   |    |
|  | Screen     |  |  Display   |  | Dashboard |  | History   |    |
|  +-----+------+  +-----+------+  +-----+-----+  +-----+-----+  |
|        |               |               |               |         |
+--------+---------------+---------------+---------------+---------+
|                     APPLICATION LAYER                             |
|  +--------------------+  +------------------+  +--------------+  |
|  | Recitation Engine  |  | Progress Tracker |  | Audio Player |  |
|  | (orchestrator)     |  | (scoring/stats)  |  | (corrections)|  |
|  +---------+----------+  +--------+---------+  +------+-------+  |
|            |                      |                    |         |
+------------+----------------------+--------------------+---------+
|                     PROCESSING LAYER                              |
|  +--------------------+  +------------------+                    |
|  | Word Matcher       |  | Feedback Engine  |                    |
|  | (alignment/edit    |  | (haptic + audio  |                    |
|  |  distance)         |  |  triggers)       |                    |
|  +---------+----------+  +--------+---------+                    |
|            |                      |                              |
+------------+----------------------+------------------------------+
|                     NATIVE BRIDGE LAYER (JSI/TurboModules)       |
|  +--------------------+  +------------------+  +--------------+  |
|  | Audio Capture      |  | Speech-to-Text   |  | Haptic       |  |
|  | (mic PCM stream)   |  | (Whisper model)  |  | Feedback     |  |
|  +---------+----------+  +--------+---------+  +--------------+  |
|            |                      |                              |
+------------+----------------------+------------------------------+
|                     DATA LAYER                                    |
|  +--------------------+  +------------------+  +--------------+  |
|  | Quran Text DB      |  | Progress DB      |  | Audio Assets |  |
|  | (SQLite, offline)  |  | (SQLite + sync)  |  | (Sheikh      |  |
|  |                    |  |                   |  |  recordings) |  |
|  +--------------------+  +------------------+  +--------------+  |
+------------------------------------------------------------------+
```

## Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Recitation Screen** | Session setup (surah/ayah selection), live recitation UI, word highlighting | React Native screen with Reanimated for smooth highlights |
| **Quran Display** | Render Quran text with word-level interactivity and RTL Arabic layout | Custom text component with per-word press/highlight state |
| **Progress Dashboard** | Visualize memorization progress, streaks, accuracy scores | Charts + stats aggregated from local DB |
| **Recitation Engine** | Orchestrate the full recitation flow: start capture, receive transcriptions, run word matching, dispatch feedback | Core application service -- the "brain" of the app |
| **Word Matcher** | Compare ASR output against reference Quran text using edit distance / sliding window alignment | Tasmeea-style algorithm: normalize, sliding window, edit distance ratio |
| **Feedback Engine** | Trigger haptic feedback and correction audio when a mistake is detected | Bridges to native haptics API + audio player |
| **Audio Capture** | Access microphone, stream raw PCM audio buffers to the speech engine | Native module (Swift/Kotlin) via TurboModule, streaming PCM at 16kHz |
| **Speech-to-Text** | Run Whisper model inference on audio chunks, return transcribed Arabic text | whisper.cpp (C++) wrapped as native module, or WhisperKit on iOS / whisper.cpp on Android |
| **Quran Text DB** | Store complete Quran text with word-level metadata (surah, ayah, word index, text, transliteration) | SQLite via expo-sqlite, bundled with app |
| **Progress DB** | Store session results, accuracy scores, streaks, memorization state per ayah | SQLite with cloud sync for cross-device |
| **Audio Assets** | Word-level and ayah-level Sheikh recordings for corrections | Bundled or downloaded audio files, organized by reciter/surah/ayah/word |
| **Audio Player** | Play correction audio segments at precise word boundaries | expo-av or react-native-track-player |

## Recommended Project Structure

```
src/
+-- app/                    # Expo Router screens
|   +-- (tabs)/             # Tab navigation
|   |   +-- recite.tsx      # Recitation session screen
|   |   +-- progress.tsx    # Progress dashboard
|   |   +-- settings.tsx    # Settings & reciter selection
|   +-- session/            # Session flow screens
|   |   +-- select.tsx      # Surah/ayah selection
|   |   +-- active.tsx      # Active recitation
|   |   +-- results.tsx     # Session results
|   +-- auth/               # Authentication screens
|   +-- _layout.tsx         # Root layout
+-- components/             # Reusable UI components
|   +-- quran/              # Quran text display components
|   |   +-- AyahText.tsx    # Single ayah renderer with word highlights
|   |   +-- WordHighlight.tsx # Individual word with highlight state
|   |   +-- SurahHeader.tsx # Bismillah, surah name
|   +-- session/            # Session-related UI
|   |   +-- RecitationControls.tsx
|   |   +-- FeedbackOverlay.tsx
|   +-- progress/           # Progress visualizations
|   +-- ui/                 # Generic UI primitives
+-- services/               # Application layer services
|   +-- recitation/         # Recitation engine
|   |   +-- RecitationEngine.ts    # Orchestrator
|   |   +-- WordMatcher.ts         # Edit distance alignment
|   |   +-- FeedbackEngine.ts      # Haptic + audio triggers
|   +-- speech/             # Speech recognition abstraction
|   |   +-- SpeechService.ts       # Platform-agnostic interface
|   |   +-- types.ts               # Transcription result types
|   +-- audio/              # Audio playback for corrections
|   |   +-- CorrectionPlayer.ts
|   +-- progress/           # Progress tracking
|   |   +-- ProgressTracker.ts
|   |   +-- StreakManager.ts
|   +-- sync/               # Cloud sync
|       +-- SyncService.ts
+-- data/                   # Data layer
|   +-- db/                 # Database setup and migrations
|   |   +-- schema.ts
|   |   +-- migrations/
|   +-- repositories/       # Data access
|   |   +-- QuranRepository.ts
|   |   +-- ProgressRepository.ts
|   |   +-- SessionRepository.ts
|   +-- quran/              # Quran text data
|       +-- quran.db        # Bundled SQLite with full Quran text
+-- native/                 # Native module wrappers
|   +-- speech/             # Speech recognition native bridge
|   |   +-- WhisperModule.ts       # JS interface
|   +-- audio/              # Audio capture native bridge
|   |   +-- AudioCapture.ts        # JS interface
|   +-- haptics/            # Haptic feedback
+-- hooks/                  # React hooks
|   +-- useRecitation.ts    # Recitation session hook
|   +-- useQuranText.ts     # Quran data access hook
|   +-- useProgress.ts      # Progress data hook
+-- stores/                 # State management (Zustand)
|   +-- recitationStore.ts  # Active session state
|   +-- settingsStore.ts    # User preferences
+-- constants/              # App constants
|   +-- quran.ts            # Surah names, juz boundaries
|   +-- theme.ts            # Visual theme constants
+-- utils/                  # Utility functions
    +-- arabic.ts           # Arabic text normalization
    +-- editDistance.ts      # Edit distance algorithm
```

### Structure Rationale

- **app/:** Expo Router file-based routing. Session flow is a separate group because the recitation experience is a focused, multi-step flow distinct from tab navigation.
- **services/:** Pure TypeScript classes with no React dependency. The Recitation Engine orchestrates everything -- it is the most complex service and the core of the app. Keeping it framework-agnostic makes it testable.
- **native/:** Thin JS wrappers around TurboModules. These abstract platform differences (WhisperKit on iOS vs whisper.cpp on Android) behind a single interface.
- **data/:** SQLite repositories follow the repository pattern. The Quran text database is bundled with the app (about 5-10 MB) and never changes. Progress data uses the same SQLite but syncs to backend.
- **stores/:** Zustand for lightweight reactive state. Recitation state changes rapidly during a session (current word, highlighting position) and needs to be fast.

## Architectural Patterns

### Pattern 1: Pipeline Architecture for Recitation

**What:** The recitation flow is a pipeline: Audio Capture -> Speech-to-Text -> Word Matching -> Feedback. Each stage processes data and passes results downstream. The Recitation Engine orchestrates this pipeline.

**When to use:** Always -- this is the core architecture of the app.

**Trade-offs:** Clear separation of concerns and easy to test each stage independently. However, latency accumulates across stages, so each stage must be fast. The pipeline must handle backpressure (audio arriving faster than processing).

**Example:**
```typescript
// RecitationEngine.ts -- the orchestrator
class RecitationEngine {
  private audioCapture: AudioCapture;
  private speechService: SpeechService;
  private wordMatcher: WordMatcher;
  private feedbackEngine: FeedbackEngine;

  async startSession(surah: number, startAyah: number, endAyah: number) {
    const referenceText = await this.quranRepo.getWords(surah, startAyah, endAyah);
    this.wordMatcher.setReference(referenceText);

    this.audioCapture.onAudioChunk((pcmBuffer) => {
      // Audio flows through the pipeline
      this.speechService.processChunk(pcmBuffer);
    });

    this.speechService.onPartialResult((transcript) => {
      const matchResult = this.wordMatcher.match(transcript);
      if (matchResult.mistake) {
        this.feedbackEngine.triggerMistake(matchResult.expectedWord);
      }
      this.emit('wordProgress', matchResult.currentPosition);
    });

    this.audioCapture.start();
  }
}
```

### Pattern 2: Sliding Window Word Alignment (Tasmeea-inspired)

**What:** Instead of expecting exact transcription matches, use a sliding window over the reference text and compute edit distance ratios. This handles ASR imperfections gracefully. The algorithm normalizes both ASR output and reference text (strip diacritics, normalize whitespace), then finds the best-matching window.

**When to use:** Every time ASR output needs to be compared against reference Quran text.

**Trade-offs:** More tolerant of ASR errors than exact matching (critical for Arabic where diacritics and similar-sounding letters cause recognition issues). Slightly more compute than exact match, but negligible on modern devices. Requires careful threshold tuning to balance sensitivity (catching real mistakes) vs. tolerance (not flagging ASR artifacts).

**Example:**
```typescript
// WordMatcher.ts
class WordMatcher {
  private referenceWords: string[];
  private currentPosition: number = 0;
  private readonly MATCH_THRESHOLD = 0.5; // Tasmeea uses 0.5

  match(transcript: string): MatchResult {
    const normalized = this.normalizeArabic(transcript);
    const words = normalized.split(/\s+/);

    // Sliding window over reference starting from current position
    let bestRatio = 0;
    let bestOffset = this.currentPosition;

    for (let i = this.currentPosition; i < this.referenceWords.length; i++) {
      const windowText = this.referenceWords.slice(i, i + words.length).join(' ');
      const distance = editDistance(words.join(' '), windowText);
      const ratio = 1 - (distance / Math.max(words.join(' ').length, windowText.length));

      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestOffset = i;
      }
    }

    // Advance position or flag mistake
    if (bestRatio >= this.MATCH_THRESHOLD) {
      this.currentPosition = bestOffset + words.length;
      return { matched: true, currentPosition: this.currentPosition, mistake: false };
    } else {
      return {
        matched: false,
        currentPosition: this.currentPosition,
        mistake: true,
        expectedWord: this.referenceWords[this.currentPosition],
      };
    }
  }

  private normalizeArabic(text: string): string {
    // Remove diacritics (tashkeel), normalize alef variants, etc.
    return text
      .replace(/[\u064B-\u065F\u0670]/g, '') // strip tashkeel
      .replace(/[\u0622\u0623\u0625]/g, '\u0627') // normalize alef
      .replace(/\u0629/g, '\u0647') // taa marbuta -> haa
      .trim();
  }
}
```

### Pattern 3: Platform-Agnostic Native Module Abstraction

**What:** Wrap platform-specific speech recognition (WhisperKit on iOS, whisper.cpp on Android) behind a single TypeScript interface. The JS layer never knows which engine is running.

**When to use:** For all native capabilities (speech recognition, audio capture, haptics).

**Trade-offs:** Adds an abstraction layer, but essential for cross-platform. WhisperKit offers significantly better iOS performance (Neural Engine acceleration, CoreML optimization) compared to generic whisper.cpp on iOS, so the abstraction should not constrain platform-specific optimizations.

```typescript
// SpeechService.ts -- platform-agnostic interface
interface SpeechService {
  loadModel(modelPath: string): Promise<void>;
  processChunk(pcmBuffer: ArrayBuffer): void;
  onPartialResult(callback: (text: string) => void): void;
  onFinalResult(callback: (text: string) => void): void;
  stop(): void;
}

// Implementations selected at runtime based on Platform.OS
// iOS: WhisperKitService (uses WhisperKit via Swift TurboModule)
// Android: WhisperCppService (uses whisper.cpp via Kotlin/JNI TurboModule)
```

## Data Flow

### Core Recitation Flow (the critical path)

```
[User speaks into microphone]
        |
        v
[Audio Capture Module] -- raw PCM 16kHz mono -->
        |
        v  (via JSI, zero-copy ArrayBuffer)
[Speech-to-Text Engine] -- partial transcript (Arabic text) -->
        |
        v
[Word Matcher] -- compares against reference Quran text -->
        |
        +---> [MATCH] --> advance highlight position
        |                     |
        |                     v
        |              [UI updates word highlight]
        |
        +---> [MISTAKE] --> trigger feedback
                              |
                              v
                    [Haptic Engine] -- vibration
                    [Audio Player] -- play Sheikh correction audio
                              |
                              v
                    [UI shows mistake indicator]
```

### Data Loading Flow (app startup / session setup)

```
[App Launch]
      |
      v
[Load bundled Quran SQLite DB] -- Quran text available offline
      |
      v
[Check audio assets] -- download missing Sheikh recordings if needed
      |
      v
[Load user progress from local SQLite]
      |
      v
[Sync progress with backend if online]
```

### Session Results Flow

```
[Session Ends]
      |
      v
[Calculate accuracy score] -- mistakes / total words
      |
      v
[Store session result in local SQLite]
      |
      +---> [Update progress state] -- mark ayahs as practiced
      |
      +---> [Update streak] -- increment if daily goal met
      |
      +---> [Check milestones] -- trigger celebration if juz/surah complete
      |
      v
[Queue for cloud sync]
```

### Key Data Flows

1. **Audio-to-Feedback Loop (latency-critical):** Microphone PCM -> native STT engine -> JS word matcher -> native haptic/audio feedback. Target: under 500ms end-to-end. This is the core user experience. Every stage uses JSI (not the old bridge) for zero-serialization data transfer.

2. **Quran Text Rendering:** SQLite query -> word array -> React component tree with per-word highlight state. Must support RTL Arabic layout, proper line breaking at word boundaries, and smooth highlight transitions using Reanimated shared values.

3. **Progress Persistence:** Session results are always written to local SQLite first (offline-first). Sync to backend happens opportunistically when online. Conflict resolution uses last-write-wins with server timestamps since progress data is append-mostly.

## State Management

```
[Zustand Stores]
      |
      +-- recitationStore
      |     - sessionState: 'idle' | 'selecting' | 'active' | 'paused' | 'complete'
      |     - currentSurah, startAyah, endAyah
      |     - currentWordIndex (updates rapidly during recitation)
      |     - mistakes: array of { wordIndex, expected, heard }
      |     - elapsedTime
      |
      +-- settingsStore
      |     - selectedQari (Husary, Minshawi, etc.)
      |     - feedbackMode (haptic, audio, both)
      |     - fontSize, theme
      |
      +-- progressStore
            - memorizedAyahs: Map<surahId, Set<ayahId>>
            - streakData: { currentStreak, lastPracticeDate }
            - sessionHistory: recent sessions for dashboard

[SQLite] <--> [Zustand Stores] (hydrate on launch, persist on change)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10k users | Single backend for auth + sync. SQLite local-first handles offline. Audio assets served from CDN or bundled. This architecture works well. |
| 10k-100k users | CDN for audio assets becomes important (word-level audio for full Quran across multiple reciters is significant storage). Backend sync service needs rate limiting. Consider asset download manager with background downloads. |
| 100k+ users | Segment audio assets into downloadable packs per juz/surah to reduce initial download. Backend needs proper queue-based sync. Consider crowd-sourcing recitation data for model improvement (with consent). |

### Scaling Priorities

1. **First bottleneck: Audio asset storage and delivery.** Word-level recordings for 77,430 words across multiple reciters is roughly 2-5 GB per reciter. Cannot bundle everything. Must implement progressive download (download packs for surahs the user is working on). CDN is essential.
2. **Second bottleneck: Model size on device.** Whisper tiny is ~75 MB quantized, base is ~140 MB quantized. Users on older devices or with storage constraints need the tiny model option. Offer model quality selection in settings.

## Anti-Patterns

### Anti-Pattern 1: Cloud-Dependent Speech Recognition

**What people do:** Send audio to a cloud API (Google Speech-to-Text, Deepgram) for transcription.
**Why it is wrong:** Adds 200-500ms latency per request, requires internet (mosques often have poor connectivity), sends personal Quran recitation audio to third parties (privacy concern), and incurs per-request costs at scale.
**Do this instead:** On-device Whisper models. The Quran-fine-tuned whisper-tiny model achieves 7% WER while fitting in ~75 MB. This is the non-negotiable architectural decision for this app.

### Anti-Pattern 2: Exact String Match for Recitation Verification

**What people do:** Compare ASR output character-by-character against reference text.
**Why it is wrong:** Arabic ASR is imperfect. Diacritics, hamza variants, taa marbuta, and similar-sounding letters cause legitimate transcription differences that are not recitation mistakes. Exact matching produces false positives constantly, making the app unusable.
**Do this instead:** Normalize both texts (strip diacritics, normalize alef/hamza variants), use edit distance with a matching ratio threshold (0.5 per the Tasmeea algorithm), and use sliding window alignment to handle word insertions/deletions gracefully.

### Anti-Pattern 3: Running Audio Processing on the JS Thread

**What people do:** Pipe raw audio through the React Native JS bridge for processing.
**Why it is wrong:** The old RN bridge serializes data as JSON. Audio at 16kHz mono 16-bit generates 32KB/sec. JSON serialization of binary audio data causes massive overhead and GC pressure. Result: dropped frames, laggy UI, missed audio.
**Do this instead:** Use TurboModules with JSI for zero-copy ArrayBuffer transfer. Better yet, keep the audio capture -> STT pipeline entirely in native code and only send transcription results (small text strings) to JS. The expensive processing (FFT, model inference) should never touch the JS thread.

### Anti-Pattern 4: Storing Progress Only in Cloud

**What people do:** Require network connection to save and retrieve progress.
**Why it is wrong:** Users often practice in mosques, during travel, or in areas with poor connectivity. Losing a session's progress because of a network hiccup is a terrible user experience, especially for something as personal as Quran memorization.
**Do this instead:** Local-first with SQLite. Write everything locally immediately. Sync to cloud opportunistically. The user should never perceive any dependency on connectivity.

### Anti-Pattern 5: Loading Full Quran Audio Assets at Install

**What people do:** Bundle all Sheikh recordings (~2-5 GB per reciter) with the app or force a massive initial download.
**Why it is wrong:** App Store size limits, user storage constraints, and a terrible first-run experience. Most users will only work on 1-3 surahs at a time.
**Do this instead:** Bundle only Surah Al-Fatiha and Juz Amma (most common starting points). Download additional audio packs on-demand per surah or juz. Cache downloaded packs locally.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Quran Foundation API (quran.com) | REST API for initial data seeding; bundled SQLite for runtime | Use API during build to generate the bundled DB. Runtime queries hit local SQLite only. |
| Authentication backend (Supabase/Firebase) | Auth SDK for sign-up/login, JWT tokens | Keep auth simple. Email + social login. |
| Cloud sync backend | REST API with timestamp-based sync | POST session results, GET latest progress. Simple CRUD, no real-time needed. |
| CDN for audio assets | Direct HTTPS download of audio packs | Organize as /reciter/surah/ayah.mp3 and /reciter/surah/ayah/word.mp3 |
| quran-align project | Build-time tool for generating word timestamps | Used to prepare word-level audio segments from full ayah recordings |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| JS Layer <-> Speech Engine | TurboModule via JSI | ArrayBuffer for audio, string for transcripts. Keep interface minimal. |
| Recitation Engine <-> UI | Zustand store + event emitter | Engine writes to store; UI subscribes reactively. Decoupled. |
| Word Matcher <-> Quran DB | Direct SQLite queries via repository | Matcher requests reference text for the selected range at session start. |
| Feedback Engine <-> Native APIs | TurboModules for haptics and audio | Haptic: expo-haptics. Audio: expo-av or custom native player for gapless word playback. |
| Local DB <-> Cloud Sync | Sync service reads local, pushes to API | One-directional push with pull for conflict resolution. |

## Build Order (Dependencies Between Components)

The architecture implies this build order -- each phase depends on the previous:

1. **Quran Data Layer first.** Everything depends on having the Quran text database with word-level structure. This is foundational and has zero dependencies on other components.

2. **Quran Text Display second.** The UI for displaying Quran text with proper Arabic rendering is the most visible component and validates the data layer. Word-level interactivity (tap to hear, highlight) can work without speech recognition.

3. **Audio Capture + Speech-to-Text third.** The core technical challenge. Build the native modules, integrate Whisper, and validate that Arabic Quran transcription works on-device. This is the highest-risk component and should be proved out before building dependent features.

4. **Word Matcher + Recitation Engine fourth.** Connect STT output to the reference text using the alignment algorithm. This is where the core product experience comes together.

5. **Feedback System fifth.** Haptic feedback and correction audio playback. Depends on the word matcher knowing which word is wrong.

6. **Progress Tracking + Dashboard sixth.** Depends on completed sessions generating results. Can be built in parallel with earlier phases using mock session data.

7. **Auth + Cloud Sync last.** Enhances the app but is not part of the core loop. Users should be able to use the app fully offline before this exists.

## Sources

- [Tarteel AI - NVIDIA Case Study: Automating Real-Time Arabic Speech Recognition](https://www.nvidia.com/en-us/case-studies/automating-real-time-arabic-speech-recognition/) -- HIGH confidence, official case study
- [Tasmeea Algorithm for Quranic Transcript Verification](https://www.emergentmind.com/topics/tasmeea-algorithm) -- MEDIUM confidence, describes the sliding window edit distance approach
- [tarteel-ai/whisper-base-ar-quran (Hugging Face)](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) -- HIGH confidence, official model card, 5.75% WER
- [tarteel-ai/whisper-tiny-ar-quran (Hugging Face)](https://huggingface.co/tarteel-ai/whisper-tiny-ar-quran) -- HIGH confidence, official model card, 7.05% WER
- [whisper.cpp (GitHub)](https://github.com/ggml-org/whisper.cpp) -- HIGH confidence, official repo for on-device Whisper
- [WhisperKit (GitHub)](https://github.com/argmaxinc/WhisperKit) -- HIGH confidence, on-device ASR for Apple Silicon, 0.46s latency
- [Expo Blog: Real-time Audio Processing with Expo and Native Code](https://expo.dev/blog/real-time-audio-processing-with-expo-and-native-code) -- HIGH confidence, official Expo blog
- [Callstack: Building Real-Time Audio Pipelines in React Native](https://www.callstack.com/blog/from-files-to-buffers-building-real-time-audio-pipelines-in-react-native) -- MEDIUM confidence, authoritative RN consultancy
- [Expo Documentation: Local-first Architecture](https://docs.expo.dev/guides/local-first/) -- HIGH confidence, official docs
- [Quran Foundation API Docs](https://api-docs.quran.foundation/) -- HIGH confidence, official API
- [quran-align: Word-accurate timestamps for Quranic audio](https://github.com/cpfair/quran-align) -- MEDIUM confidence, open-source tool
- [Fixing Quran Audio Segment Timings with WhisperX](https://bilawal.net/fixing-quran-audio-segments-with-whisperx) -- MEDIUM confidence, practical implementation
- [Picovoice: React Native Speech Recognition in 2026](https://picovoice.ai/blog/react-native-speech-recognition/) -- MEDIUM confidence, commercial vendor blog but technically detailed
- [Whisper Model Sizes Explained](https://openwhispr.com/blog/whisper-model-sizes-explained) -- MEDIUM confidence, tiny=39M/75MB, base=74M/140MB quantized

---
*Architecture research for: Quran memorization mobile app with on-device speech recognition*
*Researched: 2026-03-18*

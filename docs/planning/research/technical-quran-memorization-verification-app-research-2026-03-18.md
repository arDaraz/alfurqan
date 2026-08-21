---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Quran Memorization Verification Mobile App (Tasmi)'
research_goals: 'Arabic/Quranic speech-to-text accuracy, real-time recitation comparison against correct Quranic text, low-latency mistake detection with haptic feedback, mobile app technology stack (iOS/Android)'
user_name: 'Ahmed'
date: '2026-03-18'
web_research_enabled: true
source_verification: true
---

> **Superseded stack (noted 2026-08-21).** The Flutter, Hive, and BLoC recommendation below was not adopted.
> The app was built with React Native and Expo, using `expo-sqlite` for the Quran data, `react-native-mmkv` for settings and progress, and Zustand for state.
> The root `PRD.md` holds the current stack. Read every stack row below as a record of the 2026-03-18 research, not as guidance.
> The rest of this research still stands, including the Tasmeea matching algorithm now implemented in `src/services/verification/tasmeeaMatcher.ts`.

# Research Report: Technical

**Date:** 2026-03-18
**Author:** Ahmed
**Research Type:** Technical

---

## Research Overview

This technical research document provides a comprehensive analysis of the technologies, architectures, and implementation approaches required to build **Tasmi'** — a mobile app that acts as a digital Quran memorization partner. The app listens to a user's recitation in real-time, compares it word-by-word against the correct Quranic text, and provides instant haptic feedback when a mistake is detected.

The research covers five key areas: (1) Arabic/Quranic speech-to-text technology and accuracy benchmarks, (2) real-time audio processing pipeline architecture, (3) text comparison algorithms specifically designed for Quranic verification, (4) mobile framework and on-device ML deployment options, and (5) practical implementation roadmap with cost and risk analysis. All findings are verified against current (2025-2026) web sources.

The core recommendation is a **Flutter + on-device Whisper + SQLite** stack that enables 100% offline recitation verification — a key differentiator from cloud-dependent competitors like Tarteel AI. For the full executive summary and strategic recommendations, see the Research Synthesis section at the end of this document.

---

## Technical Research Scope Confirmation

**Research Topic:** Quran Memorization Verification Mobile App (Tasmi')
**Research Goals:** Arabic/Quranic speech-to-text accuracy, real-time recitation comparison against correct Quranic text, low-latency mistake detection with haptic feedback, mobile app technology stack (iOS/Android)

**Technical Research Scope:**

- Architecture Analysis - real-time audio processing pipeline, on-device vs cloud ASR, comparison engine design
- Implementation Approaches - streaming audio capture, word-level alignment, Tajweed-aware matching, error classification
- Technology Stack - mobile frameworks, Arabic ASR engines, Quran text APIs, audio processing libraries
- Integration Patterns - speech-to-text API integration, Quran data sources, haptic feedback APIs, offline capability
- Performance Considerations - latency budget for real-time feedback, on-device model size, battery impact, accuracy vs speed

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-03-18

## Technology Stack Analysis

### Existing Market — What's Already Out There

Before choosing a tech stack, it's critical to understand the competitive landscape:

**Tarteel AI** — The leading Quran memorization app using AI. Achieves **4% word-error rate (WER)** on Quranic Arabic, the current state-of-the-art. Uses NVIDIA Riva (GPU-accelerated speech SDK) and NVIDIA NeMo for model training. Runs on **6 clusters across 4 cloud providers** (AWS, Coreweave, Linode, GCP) with V100/A100 GPUs for inference. Their proprietary audio datasets and core models are closed-source.
_Source: [Tarteel Case Study](https://zeet.co/customers/case-study/tarteel-case-study), [Tarteel ML Journey](https://tarteel.ai/blog/tarteels-ml-journey-part-1-intro-data-collection/)_

**Quran Tutor** — Uses speech recognition with color-coded feedback (red = not pronounced, orange = mispronounced, green = correct).
_Source: [Google Play](https://play.google.com/store/apps/details?id=hajigift.fatiha&hl=en_US)_

**TajweedMate** — AI-powered Tajweed checker with instant feedback on recitation.
_Source: [TajweedMate](https://tajweedmate.com/)_

**Key Insight:** Tarteel is the gold standard but is cloud-heavy. An on-device approach could differentiate Tasmi' through offline capability, lower latency, and privacy.

### Arabic/Quranic Speech Recognition Engines

This is the **most critical** technology decision for the app.

#### Cloud-Based ASR Options

| Engine | Arabic WER | Latency | Cost Model | Offline |
|--------|-----------|---------|------------|---------|
| **Google Speech-to-Text** | ~16-20% general Arabic | Low (streaming) | Per-minute | No |
| **OpenAI Whisper API** | ~8% median (multilingual) | Medium | Per-minute | No |
| **Deepgram** | Competitive | Very low (<100ms partials) | Per-minute | No |
| **NVIDIA Riva** (Tarteel's choice) | ~4% Quranic (fine-tuned) | Low | Self-hosted GPU | No |

_Source: [Deepgram Best STT APIs 2026](https://deepgram.com/learn/best-speech-to-text-apis-2026), [Incora Whisper vs Google](https://incora.software/insights/whisper-vs-google-speech-to-text)_

#### On-Device ASR Options (Critical for Real-Time Haptic Feedback)

| Engine | Model Size | Speed | Arabic Support | Platform |
|--------|-----------|-------|---------------|----------|
| **Whisper.cpp** (whisper-tiny/small) | 40-250MB | Real-time capable | Yes (99 languages) | iOS/Android via C++ |
| **WhisperKit** (Argmax) | Optimized for Apple Silicon | Real-time streaming | Yes | iOS only (Core ML) |
| **Distil-Whisper** | 49% smaller than Whisper | 6x faster, within 1% WER | Yes | Cross-platform |
| **Moonshine** | Smallest footprint | Outperforms Whisper Tiny/Small | Limited | Edge devices |
| **Vosk** | ~50MB per language | Real-time streaming | Arabic model available | iOS/Android/Flutter |
| **Picovoice Cheetah** | Small | Real-time streaming | Limited | Flutter plugin available |

_Source: [Ionio Edge Guide](https://www.ionio.ai/blog/running-transcription-models-on-the-edge-a-practical-guide-for-devices), [WhisperKit GitHub](https://github.com/argmaxinc/WhisperKit), [Northflank STT 2026](https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks)_

**Confidence Assessment:** For Quranic Arabic specifically, generic ASR models will underperform. Fine-tuning on Quranic audio data (available via [Buraaq/quran-audio-text-dataset on HuggingFace](https://huggingface.co/datasets/Buraaq/quran-audio-text-dataset)) is likely necessary. A Hybrid HMM-BLSTM approach achieved **4.63% WER** on Quranic recitation in research settings.
_Source: [IJAIN Research](https://ijain.org/index.php/IJAIN/article/view/2288), [MDPI Applied Sciences](https://www.mdpi.com/2076-3417/15/17/9521)_

### Mobile Framework Options

| Framework | Market Share | Performance | Arabic RTL | Speech Plugins | Haptics |
|-----------|------------|-------------|------------|---------------|---------|
| **Flutter** | ~46% cross-platform | Custom Impeller engine, smooth UI | Excellent built-in RTL | `speech_to_text`, Vosk, Picovoice Cheetah | `haptic_feedback` package |
| **React Native** | ~35% cross-platform | Hermes engine, bridge overhead | Good RTL support | `react-native-voice`, native modules | `react-native-haptic-feedback`, `react-native-haptic-patterns` |
| **Native Swift (iOS)** | N/A | Best possible | Native | Speech framework, WhisperKit | Core Haptics (most advanced) |
| **Native Kotlin (Android)** | N/A | Best possible | Native | SpeechRecognizer, whisper.cpp | VibrationEffect API |

_Source: [Flutter vs React Native 2026](https://dasroot.net/posts/2026/03/flutter-vs-react-native-2026-comprehensive-comparison/), [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/), [Flutter haptic_feedback](https://pub.dev/packages/haptic_feedback)_

**Flutter-specific note:** The `speechToTextBtn` widget supports both English and Arabic, and integrates with Vosk for offline recognition on devices without Google Play Services.
_Source: [speech_to_text_btn](https://pub.dev/packages/speech_to_text_btn/versions/0.0.4)_

### Quran Text Data Sources

| Source | Format | Granularity | Features | Offline-Ready |
|--------|--------|-------------|----------|---------------|
| **Quran Foundation API** | REST API | Word-level | `text_uthmani` field, translations, audio timestamps | Cache-able |
| **Al Quran Cloud API** | REST API | Verse-level | `quran-uthmani` edition, 6236 verses, multiple editions | Cache-able |
| **quran-json (GitHub)** | Static JSON | Verse-level | Uthmanic text via JSDELIVR CDN | Yes — bundle in app |
| **Quranic Arabic Corpus** | Web/Java API | Word-level | Morphological annotation, syntax treebank, semantic ontology | Partial |
| **Tarteel QUL** | Open-source library | Verse/word | Comprehensive multi-modal Quran data | Yes |

_Source: [Quran Foundation API](https://api-docs.quran.foundation/), [Al Quran Cloud](https://alquran.cloud/api), [quran-json GitHub](https://github.com/risan/quran-json), [Quranic Corpus](https://corpus.quran.com/), [Tarteel QUL](https://github.com/TarteelAI/quranic-universal-library)_

**Key Insight:** For word-level matching (essential for mistake detection), the **Quran Foundation API** with its word-level `text_uthmani` field or **Tarteel's QUL** are the strongest options. The entire Quran text is small enough (~1-2MB) to bundle offline.

### Haptic Feedback Technology

**iOS — Core Haptics (iOS 13+):**
- Fine-grained control: intensity, sharpness, duration
- Custom haptic patterns for different error types (wrong word vs skipped word vs wrong tashkeel)
- Fastest response time among mobile platforms

**Android — VibrationEffect API:**
- Predefined effects and custom vibration patterns
- Shifting towards iOS-like haptic sophistication
- Pattern arrays: on-off pulses with configurable timing

**Cross-Platform Libraries:**
- **React Native:** `react-native-haptic-patterns` supports recording/replaying complex haptic sequences with startTime, endTime, isPause
- **Flutter:** `haptic_feedback` package emulates iOS haptic patterns on Android
- **Expo:** Unified API for system vibrations across platforms

_Source: [react-native-haptic-patterns GitHub](https://github.com/SimformSolutionsPvtLtd/react-native-haptic-patterns), [Flutter haptic_feedback](https://pub.dev/packages/haptic_feedback)_

### Technology Adoption Trends

_Migration Patterns:_
- **On-device AI is accelerating** — models like Whisper.cpp and Moonshine make real-time on-device ASR practical on modern phones
- **Flutter gaining ground** at 46% cross-platform market share, with strong Arabic/RTL support
- **Fine-tuned smaller models** (Distil-Whisper, quantized models ~40MB) are replacing large cloud-dependent models for mobile use cases

_Emerging Technologies:_
- **WhisperKit** for Apple Silicon optimization (real-time streaming + voice activity detection)
- **NVIDIA Parakeet TDT** achieving RTFx >2,000 for ultra-fast inference
- **Quranic-specific datasets** on HuggingFace enabling community fine-tuning

_Community Trends:_
- Open-source Quran resources growing (Tarteel QUL, multiple Quran APIs)
- Research papers on Quranic ASR increasing, though the field is described as "still in its early stages"
- Transfer learning with pre-trained Arabic models + edit distance matching emerging as practical approach

_Source: [Northflank STT 2026](https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks), [Ionio Edge Benchmark](https://www.ionio.ai/blog/2025-edge-speech-to-text-model-benchmark-whisper-vs-competitors)_

## Integration Patterns Analysis

### Core Audio Pipeline — The Heart of the App

The Tasmi' app's integration architecture centers on a **real-time audio processing pipeline**. Here's how the key components connect:

```
[Microphone] → [Audio Capture (16kHz mono PCM)] → [Audio Buffer (0.5-2s chunks)]
     ↓
[On-Device ASR Engine] → [Recognized Arabic Text]
     ↓
[Text Comparison Engine] → [Match/Mismatch Detection]
     ↓
[Haptic Feedback Controller] → [Vibration/Haptic Alert]
```

**Audio Format Requirements:** All major ASR engines expect **16kHz mono PCM 16-bit audio**. Mobile audio capture libraries (Flutter's `record`/`flutter_sound`, React Native's audio modules) should record at 16kHz directly to avoid resampling overhead.

**Buffer Strategy:** Keep audio buffers small (0.5-2s chunks) with a ring buffer to feed the ASR engine incrementally. This is critical for low-latency — you don't want to wait for a full sentence before processing.
_Source: [Vibe Studio Flutter Whisper Guide](https://vibe-studio.ai/insights/integrating-openai-whisper-for-on-device-transcription-in-flutter)_

### Speech-to-Text Integration Patterns

#### Pattern A: On-Device (Recommended for Tasmi')

**React Native — whisper.rn:**
- Direct binding to whisper.cpp with custom `AudioStreamInterface` adapters
- Real-time transcription via `AudioPcmStreamAdapter` for streaming audio
- Overlapping audio chunks to prevent mid-sentence cuts
_Source: [whisper.rn GitHub](https://github.com/mybigday/whisper.rn)_

**React Native — ExecuTorch:**
- React Native ExecuTorch v0.3.0 runs Whisper locally with streaming-style algorithm
- Seamless transcription of any-length audio without network dependency
_Source: [Expo ExecuTorch Blog](https://expo.dev/blog/how-to-run-ai-models-with-react-native-executorch)_

**Flutter — flutter_whisper_kit / whisper_kit:**
- `flutter_whisper_kit`: On-device speech recognition using WhisperKit (Apple Silicon optimized)
- `whisper_kit`: Offline speech-to-text on Android using Whisper models directly
_Source: [flutter_whisper_kit](https://pub.dev/packages/flutter_whisper_kit), [whisper_kit](https://pub.dev/packages/whisper_kit)_

**Confidence Level:** HIGH — On-device Whisper integration is mature on both platforms as of 2026.

#### Pattern B: Cloud-Based (Fallback / Higher Accuracy)

If on-device accuracy proves insufficient for Quranic Arabic:

- **WebSocket streaming** is the standard for real-time cloud ASR — persistent bidirectional connection eliminates handshake overhead per utterance
- AssemblyAI delivers ~300ms P50 latency via WebSocket with immutable transcription (words don't change once transcribed)
- Deepgram Flux offers sub-100ms partial results with built-in end-of-turn detection
- ElevenLabs Scribe v2 achieves under 150ms transcription latency over WebSocket

**Key Decision:** WebSocket streaming >> REST for real-time. REST is only suitable for batch/non-real-time scenarios.
_Source: [AssemblyAI Streaming](https://www.assemblyai.com/products/streaming-speech-to-text), [Deepgram Streaming](https://deepgram.com/learn/streaming-speech-recognition-api)_

### Quran Text Data Integration

#### Quran Foundation API (Primary Recommendation)

- **OAuth2 authentication** with `client_credentials` grant type and `content` scope
- **SDK available:** `@quranjs/api` handles auth, token caching, automatic retry
- **Word-level retrieval:** Use `fields=text_uthmani` for Uthmanic script, with word-level fields available in response
- **Endpoints:** By chapter, by specific verse key (e.g., "2:255"), by page
- Supports multiple Arabic scripts: Uthmani, IndoPak, and more

```javascript
// Example: Quran Foundation SDK
import { QuranClient, Language } from "@quranjs/api";
// Retrieve verse with word-level text
// GET /verses/by_key/2:255?fields=text_uthmani&word_fields=text_uthmani
```

_Source: [Quran Foundation API Docs](https://api-docs.quran.foundation/), [Quick Start](https://api-docs.quran.foundation/docs/quickstart/)_

#### Offline Data Strategy

The entire Quran text (~6,236 verses, ~77,000+ words) is small enough to **bundle entirely within the app**:
- Pre-download all word-level Uthmanic text at first launch or bundle in app binary
- Store in local SQLite/Room database for instant lookup
- No network dependency during recitation sessions
- Sync periodically for corrections or additional data (translations, tafsir)

**Architecture:** Offline-first with local database as single source of truth. Network is a synchronization mechanism, not a dependency.
_Source: [Android Offline-First Guide](https://developer.android.com/topic/architecture/data-layer/offline-first)_

### Arabic Text Comparison Engine

This is where the core "mistake detection" logic lives — comparing ASR output against the correct Quranic text.

#### The Tasmeea Algorithm (Directly Relevant!)

A published algorithm specifically for **Quranic transcript verification** uses:
1. **Normalization:** Remove diacritics (tashkeel) and extraneous spaces from both ASR output and reference text
2. **Sliding window alignment:** Windowed comparison between normalized candidate and reference
3. **Edit distance scoring:** Each window comparison computes edit distance, converted to matching ratio: `matching_ratio = 1 - (edit_distance / window_length)`
4. **Acceptance threshold:** If matching_ratio falls below threshold → flag as mistake

_Source: [Tasmeea Algorithm](https://www.emergentmind.com/topics/tasmeea-algorithm)_

#### Diacritic-Aware Matching (Advanced)

For detecting tashkeel errors (wrong harakat):
- **Diacritic distance maps** assign specific distances between diacritic pairs (e.g., fatha ↔ no-diacritic)
- **Implication relationships** check if letter diacritics match in order and value
- More nuanced than simple string comparison — can distinguish between "wrong word" vs "wrong pronunciation mark"

_Source: [Diacritic-Based Matching](http://www.jarrar.info/publications/JZAA18.pdf)_

#### Comparison Strategy for Tasmi'

```
ASR Output: "بسم الله الرحمن الرحيم"
Reference:  "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"

Step 1: Normalize both (strip tashkeel) → compare base consonants
Step 2: If base match → optionally check tashkeel accuracy
Step 3: If mismatch → classify error type (wrong word, skipped word, wrong order)
Step 4: Trigger appropriate haptic feedback
```

### Haptic Feedback Integration

#### Error-Type to Haptic Mapping

| Error Type | Haptic Pattern | iOS (Core Haptics) | Android (VibrationEffect) |
|-----------|---------------|---------------------|--------------------------|
| Wrong word | Strong single pulse | `.impact(style: .heavy)` | `createOneShot(100, 255)` |
| Skipped word | Double pulse | Custom pattern: two impacts | `createWaveform([0,50,100,50], [255,0,255,0])` |
| Wrong tashkeel | Gentle nudge | `.impact(style: .light)` | `createOneShot(30, 100)` |
| Long pause (forgot) | Escalating vibration | Ramping intensity pattern | Increasing amplitude waveform |

**Cross-Platform:**
- Flutter: `haptic_feedback` package provides unified API, emulates iOS patterns on Android
- React Native: `react-native-haptic-patterns` supports recording/replaying complex haptic sequences with startTime, endTime, isPause
_Source: [react-native-haptic-patterns](https://github.com/SimformSolutionsPvtLtd/react-native-haptic-patterns), [Flutter haptic_feedback](https://pub.dev/packages/haptic_feedback)_

### Integration Security Patterns

- **Quran Foundation API:** OAuth2 with client_credentials — SDK handles token lifecycle
- **On-device models:** No API keys needed, no data leaves the device
- **User progress data:** Encrypt locally, optional cloud sync with user consent
- **Audio data:** Process on-device, never transmit recitation audio to servers (privacy-first)

### Integration Architecture Summary

| Component | Integration Pattern | Protocol | Offline? |
|-----------|-------------------|----------|----------|
| Audio Capture → ASR | On-device native binding | In-process (C++/native) | Yes |
| ASR → Text Comparison | In-app function call | In-memory | Yes |
| Text Comparison → Haptics | Platform API call | OS-level | Yes |
| Quran Text Data | Pre-bundled + API sync | REST (initial load only) | Yes |
| User Progress | Local DB + optional cloud | SQLite + REST sync | Yes |
| ASR Model Updates | Background download | HTTPS | Download only |

**Key Insight:** The entire recitation verification flow (audio → ASR → comparison → haptic) can run **100% offline** after initial setup. This is the critical differentiator from Tarteel's cloud-heavy approach.

## Architectural Patterns and Design

### System Architecture — Recommended Pattern

**Clean Architecture with MVVM + Feature Modules** is the recommended approach for Tasmi'. This separates the app into distinct layers and feature domains.

```
┌─────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Recitation│  │ Progress │  │  Settings/Surah   │  │
│  │  Screen   │  │  Screen  │  │    Selection      │  │
│  └─────┬─────┘  └─────┬────┘  └────────┬──────────┘  │
│        │              │               │              │
│  ┌─────┴─────┐  ┌─────┴────┐  ┌───────┴──────────┐  │
│  │ Recitation│  │ Progress │  │    Navigation     │  │
│  │ ViewModel │  │ ViewModel│  │    ViewModel      │  │
│  └─────┬─────┘  └─────┬────┘  └────────┬──────────┘  │
├────────┼──────────────┼────────────────┼─────────────┤
│                   DOMAIN LAYER                       │
│  ┌──────────────────────────────────────────────┐    │
│  │              Use Cases                        │    │
│  │  • StartRecitationSession                     │    │
│  │  • ProcessAudioChunk                          │    │
│  │  • CompareWithReference                       │    │
│  │  • TriggerHapticFeedback                      │    │
│  │  • TrackMemorizationProgress                  │    │
│  └──────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────┤
│                    DATA LAYER                        │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  ASR Engine │  │ Quran Text │  │   Progress    │  │
│  │ Repository  │  │ Repository │  │  Repository   │  │
│  └──────┬──────┘  └──────┬─────┘  └───────┬───────┘  │
│         │               │                │           │
│  ┌──────┴──────┐  ┌─────┴──────┐  ┌──────┴───────┐  │
│  │  Whisper/   │  │  Local DB  │  │  SQLite/     │  │
│  │  On-Device  │  │  (Quran    │  │  Hive        │  │
│  │  Model      │  │   Text)    │  │  (Progress)  │  │
│  └─────────────┘  └────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────┘
```

MVVM dominates modern mobile toolkits in 2026 — Android Jetpack, SwiftUI, and Flutter's Riverpod/Provider/BLoC ecosystem all align with it. For Flutter specifically, **MVVM with BLoC** offers predictable state management, separation of concerns, and testable business logic independent of UI.
_Source: [Architecture Patterns in Mobile 2026](https://medium.com/@jyc.dev/architecture-patterns-in-mobile-development-2026-mvvm-mvi-and-clean-architecture-f26583f53522), [Flutter Architecture Guide](https://docs.flutter.dev/app-architecture/guide)_

### Feature Module Decomposition

Each module is a self-contained unit with its own domain and presentation logic:

| Module | Responsibility | Key Dependencies |
|--------|---------------|-----------------|
| **`core/audio`** | Microphone capture, audio buffering (16kHz PCM), stream management | Platform audio APIs |
| **`core/asr`** | On-device Whisper model loading, inference, text output | whisper.cpp / WhisperKit |
| **`core/quran-data`** | Quran text storage, word-level lookup, surah/ayah navigation | SQLite + bundled Uthmanic text |
| **`core/comparison`** | Tasmeea algorithm, edit distance, diacritic-aware matching | Quran data module |
| **`core/haptics`** | Haptic pattern definitions, error-type-to-vibration mapping | Platform haptic APIs |
| **`feature/recitation`** | Recitation session UI, real-time feedback display, audio pipeline orchestration | All core modules |
| **`feature/progress`** | Memorization tracking, spaced repetition scheduling, statistics | Progress repository |
| **`feature/settings`** | Surah selection, sensitivity settings, haptic preferences | App config |

This modular approach means each module can be developed, tested, and maintained independently.
_Source: [Android Modularization Guide](https://developer.android.com/topic/modularization), [Modular Architecture in Mobile](https://dashdevs.com/blog/modular-architecture-in-mobile-development/)_

### Real-Time Audio Processing Architecture

The audio processing pipeline is the most performance-critical path in the app:

```
┌─────────────────── Audio Thread (High Priority) ───────────────────┐
│                                                                     │
│  [Microphone] → [Ring Buffer] → [Audio Chunks (0.5-2s)]           │
│                                      │                              │
│                              ┌───────┴────────┐                    │
│                              │  ASR Inference  │                    │
│                              │  (Background    │                    │
│                              │   Thread/       │                    │
│                              │   Isolate)      │                    │
│                              └───────┬─────────┘                    │
│                                      │                              │
│                              [Recognized Words]                     │
│                                      │                              │
│                              ┌───────┴─────────┐                   │
│                              │ Text Comparison  │                   │
│                              │ (Main Thread)    │                   │
│                              └───────┬──────────┘                   │
│                                      │                              │
│                          ┌───────────┴───────────┐                 │
│                          │                       │                  │
│                    [Match ✓]              [Mismatch ✗]              │
│                    Update UI              Trigger Haptic            │
│                    (next word)            + Update UI               │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Audio capture on dedicated thread** — never block the UI thread with microphone I/O
- **ASR inference in background isolate** (Flutter) or background thread — Whisper inference is CPU-intensive
- **Comparison engine on main thread** — lightweight string operations, needs immediate UI access
- **Haptic triggers are synchronous** — OS haptic APIs are designed for immediate response

**Latency Budget:**
| Stage | Target Latency | Notes |
|-------|---------------|-------|
| Audio capture + buffering | 500ms-2s | Buffer size tradeoff: smaller = faster feedback, larger = better accuracy |
| ASR inference (on-device) | 100-500ms | Depends on model size; Whisper Tiny ~100ms, Small ~300ms |
| Text comparison | <10ms | Simple string operations with pre-indexed reference text |
| Haptic trigger | <5ms | OS-level, near-instant |
| **Total pipeline** | **~600ms - 2.5s** | **Acceptable for word-by-word correction** |

_Source: [Real-Time Sound Classification on Android](https://medium.com/@harissabil/real-time-sound-classification-on-android-running-ml-models-in-a-foreground-service-dcf9fbe3e6ca), [On-Device ML in Android](https://proandroiddev.com/on-device-machine-learning-in-android-frameworks-and-ecosystem-8c0640edfff4)_

### Data Architecture

#### Local-First with SQLite + Hive

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| **Quran text** (Uthmanic, word-level) | SQLite | Relational queries needed (by surah, ayah, word index) |
| **ASR model files** (~40-250MB) | App filesystem | Large binary, loaded into memory at session start |
| **User progress** (per-ayah completion, accuracy scores) | Hive (key-value) | Fast reads/writes, no relational queries needed |
| **Session history** (timestamped recitation logs) | SQLite | Structured data for analytics and spaced repetition |
| **App settings** (haptic preferences, selected surah) | Hive / SharedPreferences | Simple key-value pairs |

**Hive** is a blazing fast, lightweight key-value database written in pure Dart — no native dependencies, fully offline. SQLite remains the best option when data relationships and queries matter.
_Source: [Offline-First Flutter with SQLite and Hive](https://medium.com/@ravipatel84184/building-offline-first-flutter-apps-with-sqlite-and-hive-b4a4df21d4cd), [SQLite in Flutter 2026](https://medium.com/@ankii8946/sqlite-in-flutter-building-a-fast-offline-first-database-for-production-apps-eba29b349397)_

#### Spaced Repetition for Memorization Progress

Existing Quran memorization apps provide proven patterns for progress tracking:

- **Mathani** uses spaced repetition with XP, achievements, and levels to gamify Hifdh
- **Retain Quran** uses AI-powered smart flashcards scheduled at optimal review intervals, with heatmaps and progress reports
- **MonthlyQuran** implements a **7-Station Spaced Repetition Algorithm** based on Ebbinghaus's Forgetting Curve — moving content from short-term to long-term memory over ~1 month

**For Tasmi':** Track accuracy per ayah over time. Ayahs with frequent mistakes surface more often for review. This data can drive a "review mode" suggesting which passages need the most practice.
_Source: [Mathani App](https://www.mathani.app/), [MonthlyQuran GitHub](https://github.com/hadealahmad/MonthlyQuran), [Retain Quran](https://retainquranapp.com/)_

### Security Architecture

For a Quran memorization app, the security profile is moderate — no payment data, but user progress and potentially audio recordings need protection.

| Concern | Solution | Implementation |
|---------|----------|---------------|
| **API keys** (Quran Foundation) | Platform keystore | iOS Keychain / Android Keystore |
| **Local database encryption** | SQLCipher | Transparent full-database encryption for SQLite |
| **User auth tokens** (if cloud sync) | Encrypted storage | EncryptedSharedPreferences (Android) / Keychain (iOS) |
| **Audio recordings** (if stored) | AES-256 encryption | Encrypt before writing to filesystem |
| **Network traffic** | HTTPS/TLS 1.2+ | All API calls over secure transport |
| **On-device model** | Integrity check | Hash verification on model download |

**Privacy-First Design:** Audio is processed on-device and never transmitted to servers. User recitation data stays local unless the user explicitly opts into cloud sync.
_Source: [Mobile App Security Best Practices 2025](https://nextnative.dev/blog/mobile-app-security-best-practices), [Secure Mobile App Design 2026](https://www.etimablog.com/2026/03/how-to-design-secure-mobile-app.html)_

### Deployment and Operations Architecture

| Aspect | Approach |
|--------|---------|
| **App distribution** | App Store (iOS) + Google Play (Android) |
| **ASR model delivery** | Bundle smallest model (Whisper Tiny ~40MB) in app binary; offer larger models as optional downloads |
| **Quran data updates** | Bundle complete text at build time; check for corrections on app launch |
| **Crash reporting** | Firebase Crashlytics or Sentry |
| **Analytics** | Firebase Analytics (usage patterns, most-practiced surahs) |
| **CI/CD** | GitHub Actions → Codemagic/Fastlane for Flutter builds |
| **OTA updates** | Shorebird (Flutter) for instant patches without app store review |

## Implementation Approaches and Technology Adoption

### Recommended Technology Stack Decision

Based on all research conducted, here is the recommended stack for Tasmi':

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | **Flutter** (Dart) | 46% cross-platform market share, excellent Arabic RTL, single codebase for iOS+Android, strong on-device ML ecosystem |
| **Architecture** | Clean Architecture + MVVM with BLoC | Industry standard for Flutter 2026, testable, separation of concerns |
| **ASR Engine** | **Whisper (on-device)** via `whisper_kit` (Android) + `flutter_whisper_kit` (iOS) | Offline-first, privacy-preserving, fine-tunable for Quranic Arabic |
| **ASR Model** | Start with Whisper Small (~250MB), offer Whisper Tiny (~40MB) for older devices | Balance between accuracy and size; fine-tune on Quranic dataset |
| **Quran Data** | Bundled SQLite database (Quran Foundation data, Uthmanic text, word-level) | Instant offline access, relational queries for surah/ayah/word lookup |
| **Text Comparison** | Custom implementation of Tasmeea Algorithm (normalized edit distance) | Published, proven approach for Quranic transcript verification |
| **Haptics** | `haptic_feedback` Flutter package + platform channels for advanced patterns | Cross-platform with iOS Core Haptics fallback for richer feedback |
| **Progress Storage** | Hive (key-value) for user progress + SQLite for session history | Fast writes for real-time tracking, structured queries for analytics |
| **State Management** | flutter_bloc | Predictable, testable, widely adopted in Flutter ecosystem |

### Development Phases and Timeline

For a solo developer or small team, here is a realistic phased approach:

#### Phase 1: Foundation MVP (6-8 weeks)
- Flutter project setup with Clean Architecture scaffolding
- Quran text database integration (bundled SQLite with Uthmanic text)
- Basic surah/ayah selection and display
- Audio capture pipeline (microphone → 16kHz PCM buffer)
- On-device Whisper integration (pre-trained, no fine-tuning)
- Basic text comparison (normalized edit distance)
- Simple haptic feedback on mismatch detection
- **Deliverable:** Working prototype that can detect obvious word-level mistakes

#### Phase 2: Core Polish (4-6 weeks)
- Diacritic-aware comparison engine (tashkeel matching)
- Multiple haptic patterns per error type (wrong word, skipped, wrong tashkeel)
- Real-time UI feedback (word highlighting as you recite)
- Surah/juz navigation and bookmarking
- Basic progress tracking (per-ayah accuracy scores)
- Performance optimization (latency tuning)
- **Deliverable:** Usable app for personal Tasmi' practice

#### Phase 3: Intelligence Layer (4-6 weeks)
- Fine-tune Whisper on Quranic audio dataset (HuggingFace pipeline)
- Spaced repetition algorithm for review scheduling
- Detailed progress analytics (heatmaps, accuracy trends)
- Multiple recitation speed support
- Offline model management (download larger models optionally)
- **Deliverable:** Smart memorization assistant with personalized review

#### Phase 4: Launch Readiness (2-4 weeks)
- App Store and Google Play submission preparation
- Crash reporting (Firebase Crashlytics)
- Analytics integration
- Onboarding flow
- Privacy policy and compliance
- Beta testing with target users
- **Deliverable:** Production-ready app

**Total Estimated Timeline: 4-6 months** for a focused developer.
_Source: [Flutter App Development Cost Guide 2026](https://appinventiv.com/blog/flutter-app-development-cost/)_

### Fine-Tuning Whisper for Quranic Arabic

This is the **highest-impact technical investment** for improving accuracy beyond generic Arabic ASR.

**Process:**
1. **Dataset:** Use [Buraaq/quran-audio-text-dataset](https://huggingface.co/datasets/Buraaq/quran-audio-text-dataset) on HuggingFace — Quranic recitation audio paired with text
2. **Base model:** Start with `whisper-small` (best accuracy/size tradeoff for mobile)
3. **Framework:** HuggingFace Transformers + Accelerate for training
4. **Training:** Fine-tune using the HuggingFace sequence-to-sequence pipeline with careful learning rate tuning (critical hyperparameter for pre-trained models)
5. **Evaluation:** Measure WER on held-out Quranic test set using `evaluate` + `jiwer`
6. **Export:** Convert to ONNX/Core ML/TFLite for on-device deployment
7. **Size optimization:** Quantize to reduce model size (INT8 quantization can halve model size with minimal accuracy loss)

**Expected improvement:** Fine-tuning can bring WER from ~8% (generic Whisper) down toward **4-5%** for Quranic Arabic, approaching Tarteel's state-of-the-art.
_Source: [HuggingFace Fine-Tune Whisper Guide](https://huggingface.co/blog/fine-tune-whisper), [whisper-finetune GitHub](https://github.com/vasistalodagala/whisper-finetune)_

### Testing Strategy

Flutter's testing pyramid applies well to Tasmi':

| Test Type | What to Test | Tools |
|-----------|-------------|-------|
| **Unit Tests** (many, fast) | Tasmeea comparison algorithm, edit distance calculation, diacritic normalization, spaced repetition scoring | `flutter_test`, `mockito` |
| **Widget Tests** (moderate) | Recitation screen UI, progress display, surah selector, word highlighting | `flutter_test` widget testing |
| **Integration Tests** (few, slow) | Full recitation session flow (audio → ASR → comparison → haptic), Quran database queries | `integration_test`, Firebase Test Lab |

**Speech Recognition Testing Pattern:** Wrap the Whisper plugin in an abstract interface and use dependency injection. Mock the ASR output in unit/widget tests to test the comparison engine independently of the actual speech recognition.
_Source: [Flutter Testing Best Practices](https://www.walturn.com/insights/best-practices-for-testing-flutter-applications), [Flutter Testing Guide](https://docs.flutter.dev/testing/overview)_

### CI/CD and Deployment

| Tool | Purpose | Cost |
|------|---------|------|
| **Codemagic** | Flutter-specialized CI/CD, auto-builds for iOS + Android | Free tier: 500 min/month |
| **Fastlane** | Automate App Store + Google Play uploads | Open-source, free |
| **GitHub Actions** | Code quality checks, test automation | Free for public repos |
| **Firebase App Distribution** | Beta testing distribution | Free tier available |
| **Shorebird** | OTA code-push updates (skip app store review for patches) | Free for small apps |

**Workflow:** PR merge → GitHub Actions (lint + unit tests) → Codemagic (build + integration tests) → Fastlane (publish to TestFlight/Play Console) → Production release.
_Source: [Codemagic Flutter CI/CD](https://blog.codemagic.io/publishing-flutter-apps-to-appstore/), [Fastlane + Flutter](https://nttdata-dach.github.io/posts/dd-fluttercicd-01-basics/)_

### Cost Optimization

| Item | Estimated Cost | Notes |
|------|---------------|-------|
| **Development** (solo dev, 4-6 months) | $0 (your time) or $15K-40K (hired) | Flutter single codebase saves 30-40% vs native |
| **Apple Developer Account** | $99/year | Required for App Store |
| **Google Play Developer Account** | $25 one-time | Required for Play Store |
| **Codemagic CI/CD** | $0 (free tier) | 500 build minutes/month |
| **GPU for fine-tuning** | $50-200 | One-time: ~10-20 hours on cloud GPU (Colab Pro, Lambda, etc.) |
| **Firebase** (Crashlytics + Analytics) | $0 (free tier) | Generous free limits |
| **Ongoing maintenance** | 15-25% of dev cost/year | Bug fixes, OS updates, model improvements |

**Total launch cost (solo developer):** ~$200-400 out of pocket (accounts + GPU time).

### Risk Assessment and Mitigation

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Quranic Arabic ASR accuracy insufficient** | HIGH | MEDIUM | Fine-tune on Quranic dataset; offer cloud fallback; start with common surahs first |
| **On-device model too large for older phones** | MEDIUM | MEDIUM | Offer Whisper Tiny (40MB) as default; larger models as optional download |
| **Latency too high for real-time feedback** | HIGH | LOW | Smaller audio buffers; Whisper Tiny for speed; skip tashkeel comparison in fast mode |
| **Arabic dialect variation in recitation** | MEDIUM | HIGH | Focus on Classical/Quranic Arabic (standardized); Tajweed rules reduce variation |
| **Battery drain from continuous audio processing** | MEDIUM | MEDIUM | Efficient model (quantized); stop processing during pauses; session time limits |
| **App Store rejection** | LOW | LOW | Follow Apple/Google guidelines; privacy-first design (no audio sent to servers) |
| **Competition from Tarteel** | MEDIUM | HIGH | Differentiate on offline-first, privacy, open-source; target underserved markets |

**Key Challenge from Research:** Arabic has enormous dialectal variety, complex morphology, and limited annotated data compared to English. However, Quranic Arabic is **standardized** — all reciters follow the same Uthmanic text with Tajweed rules, which significantly reduces the dialectal challenge.
_Source: [IEEE Arabic Speech Recognition Challenges](https://ieeexplore.ieee.org/document/10466536/), [Arabic ASR Progress](https://www.sciencedirect.com/science/article/abs/pii/S0167639324000815)_

### Monetization Context

The Islamic app market is substantial and growing:
- **Tarteel AI:** Weekly revenue peaked at **$14.3K** in Q1 2025 with 141.9K active users
- **Khatmah:** Weekly revenue reached **$11.6K** with 844.9K active users
- **Muslim Pro:** 62M downloads, 90% revenue from ads, 10% from premium subscriptions
- **Freemium model** dominates: basic features free, premium for advanced analytics/unlimited sessions
- **Ads are generally avoided** in Quran-focused apps (considered inappropriate during recitation)

**Recommended for Tasmi':** Freemium — free basic recitation verification, premium for detailed analytics, spaced repetition scheduling, advanced comparison modes.
_Source: [Sensor Tower Q1 2025 Quran Apps](https://sensortower.com/blog/2025-q1-ios-top-5-books-units-mid_east-6042071f241bc16eb8c33b77), [Mathani Best Quran Apps 2025](https://www.mathani.app/blog/best-quran-memorization-apps-2025)_

## Technical Research Recommendations

### Implementation Roadmap Summary

```
Month 1-2:  Foundation MVP — Audio pipeline + Whisper + basic comparison + haptics
Month 3:    Core Polish — Diacritic matching + UI feedback + progress tracking
Month 4:    Intelligence — Fine-tune Whisper + spaced repetition + analytics
Month 5:    Launch Prep — Testing + beta + submission
Month 6:    Launch + iterate based on user feedback
```

### Technology Stack Recommendation (Final)

**Primary:** Flutter + Whisper (on-device) + SQLite + Hive + BLoC
**Why:** Cross-platform from day one, fully offline-capable, privacy-first, fine-tunable ASR, proven architecture patterns

### Key Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| **ASR Word Error Rate** | <5% on Quranic Arabic | Automated test set evaluation |
| **End-to-end latency** | <2 seconds (audio to haptic) | In-app instrumentation |
| **Mistake detection accuracy** | >90% (correctly flagging real errors) | User feedback + test corpus |
| **False positive rate** | <10% (incorrectly flagging correct recitation) | User feedback + test corpus |
| **App size** | <100MB (with Whisper Tiny) | Build artifact measurement |
| **Battery impact** | <15% per hour of active recitation | Device battery monitoring |
| **User retention** (Day 7) | >40% | Firebase Analytics |

---

## Research Synthesis

# Tasmi': Building an AI-Powered Quran Memorization Verification App — Comprehensive Technical Research

## Executive Summary

The convergence of on-device speech recognition, open Quranic text APIs, and cross-platform mobile frameworks has made it technically feasible to build a **fully offline Quran memorization verification app** in 2026. This research confirms that the core concept — listening to recitation, comparing against correct text, and providing instant haptic feedback on mistakes — is achievable with current technology, though Arabic/Quranic speech recognition accuracy remains the primary technical challenge.

The recommended approach uses **Flutter** for cross-platform development, **on-device Whisper** (fine-tuned on Quranic audio data) for speech recognition, **SQLite** with bundled Uthmanic text for instant Quran lookup, and the published **Tasmeea Algorithm** for transcript verification. This architecture delivers a complete recitation verification pipeline that runs **100% offline** after initial setup — a significant differentiator from market leader Tarteel AI, which relies on cloud infrastructure across 4 providers with GPU-accelerated inference.

The total estimated development timeline is **4-6 months** for a focused developer, with out-of-pocket costs under **$400** (developer accounts + cloud GPU time for model fine-tuning). The Islamic app market shows strong revenue potential, with Tarteel AI earning $14.3K/week and the broader Quran app category showing consistent growth in 2025.

**Key Technical Findings:**

- On-device Whisper achieves real-time ASR on modern smartphones with ~8% WER on Arabic; fine-tuning on Quranic datasets can bring this to **4-5%**, approaching Tarteel's state-of-the-art
- The **Tasmeea Algorithm** — a published method specifically for Quranic transcript verification using normalized edit distance with sliding window alignment — is directly applicable
- End-to-end latency (microphone → haptic vibration) is achievable within **~600ms-2.5s**, acceptable for word-by-word correction
- Quranic Arabic is **standardized** (all reciters follow Uthmanic text with Tajweed rules), significantly reducing the dialectal variation challenge that plagues general Arabic ASR
- The entire Quran text (~6,236 verses) is small enough (~1-2MB) to bundle entirely within the app

**Top Strategic Recommendations:**

1. **Start with on-device Whisper Small** — best accuracy/size tradeoff; fine-tune on HuggingFace Quranic datasets before launch
2. **Build offline-first** — this is the key differentiator; never require internet for the core recitation verification flow
3. **Use Flutter** — single codebase for iOS+Android, excellent Arabic RTL support, mature on-device ML plugins
4. **Launch with common surahs first** — validate ASR accuracy on Al-Fatiha, Juz Amma (most memorized) before expanding
5. **Freemium monetization** — free basic verification, premium for analytics, spaced repetition, and advanced features

## Table of Contents

1. Research Introduction and Significance
2. Technology Stack Analysis (Speech Recognition, Mobile Frameworks, Quran Data, Haptics)
3. Integration Patterns (Audio Pipeline, ASR Integration, Text Comparison, Haptic Mapping)
4. Architectural Patterns (Clean Architecture, Feature Modules, Data Architecture, Security)
5. Implementation Approaches (Development Phases, Fine-Tuning, Testing, CI/CD, Costs)
6. Future Outlook and Innovation Opportunities
7. Research Methodology and Sources
8. Conclusion and Next Steps

## 1. Research Introduction and Significance

### Why This Research Matters Now

The practice of Quran memorization (Hifdh) is a central tradition in Islam, with millions of Muslims worldwide committing the Quran to memory. Traditionally, memorization verification (Tasmi') requires a human teacher — someone who follows along silently and corrects the reciter when they make a mistake. This creates a bottleneck: access to qualified teachers is limited, scheduling is inflexible, and self-practice without verification leads to uncorrected errors becoming deeply ingrained.

Modern AI is now reshaping this landscape. Major technology companies and institutions are increasingly competing to develop comprehensive Quranic platforms that combine voice-based recitation correction, textual explanations, and extensive reference databases. Apps like Tarteel, Retain Quran, and Mathani are demonstrating that technology can meaningfully augment the memorization journey.
_Source: [ShiaWaves - Smart Mushaf Era](https://shiawaves.com/english/news/science/ai-news/140327-era-of-smart-mushaf-how-technology-is-reshaping-muslims-engagement-with-quran-during-ramadan/), [Quranica Journal - AI in Quranic Memorization](https://ejournal.um.edu.my/index.php/quranica/article/view/64970)_

The timing is optimal for Tasmi' because:
- **On-device ASR has matured** — Whisper.cpp, WhisperKit, and Distil-Whisper make real-time on-device speech recognition practical on smartphones
- **Quranic datasets are now available** — HuggingFace hosts Quranic audio-text paired datasets for fine-tuning
- **Flutter has reached dominance** — 46% cross-platform market share with strong Arabic/RTL and ML plugin ecosystems
- **The market is proven** — Tarteel's $14.3K/week revenue validates demand for AI-powered Quran memorization tools

### Research Methodology

This technical research was conducted through **systematic web-verified analysis** covering:

- **Technical Scope:** Arabic/Quranic ASR accuracy, real-time audio processing, text comparison algorithms, mobile frameworks, haptic feedback APIs, offline architecture, security, deployment
- **Data Sources:** Academic papers (IEEE, MDPI, ResearchGate), official documentation (Flutter, HuggingFace, Apple, Android), industry benchmarks (Northflank, Deepgram, AssemblyAI), market data (Sensor Tower), open-source repositories (GitHub), and competitor analysis (Tarteel, Mathani, Retain Quran)
- **Analysis Framework:** Broad survey of all options followed by deep dives into the most promising approaches, with risk assessment and confidence levels
- **Time Period:** Current state as of March 2026, with forward-looking trends through 2027
- **Verification:** All technical claims cited with live web sources; confidence levels noted for uncertain data

### Research Goals — Achieved

**Original Goals:**
- Arabic/Quranic speech-to-text accuracy → **Achieved:** Comprehensive ASR comparison with WER benchmarks, fine-tuning guide
- Real-time recitation comparison against correct Quranic text → **Achieved:** Tasmeea Algorithm identified, diacritic-aware matching documented
- Low-latency mistake detection with haptic feedback → **Achieved:** End-to-end latency budget modeled at 600ms-2.5s with error-type haptic mapping
- Mobile app technology stack (iOS/Android) → **Achieved:** Complete Flutter-based stack recommendation with all component choices justified

## 6. Future Outlook and Innovation Opportunities

### Near-Term Evolution (2026-2027)

**On-Device AI Acceleration:**
Every major smartphone OEM now ships AI-enabled features on flagships (as of January 2026). The AI landscape is shifting from large to small language models optimized for edge environments, with Gartner predicting organizations will use task-specific SLMs 3x more than general-purpose LLMs by 2027. This trend directly benefits Tasmi' — smaller, faster, more accurate ASR models will continue to improve.
_Source: [Edge AI Vision - On-Device LLMs 2026](https://www.edge-ai-vision.com/2026/01/on-device-llms-in-2026-what-changed-what-matters-whats-next/), [Dell Edge AI Predictions 2026](https://www.dell.com/en-us/blog/the-power-of-small-edge-ai-predictions-for-2026/)_

**Hybrid AI Architecture:**
Workloads will toggle dynamically between on-device and cloud: simple queries stay local to save battery/cost, while heavy reasoning hits the cloud. For Tasmi', this means the core recitation verification stays on-device (fast, private, offline), while optional features like detailed Tajweed analysis or recitation quality scoring could leverage cloud AI.
_Source: [Sensory Edge AI 2026 Predictions](https://sensory.com/edge-ai-2026/)_

**Memory Bandwidth as Key Constraint:**
The field has learned to treat memory bandwidth — not compute — as the binding constraint for on-device AI, building smaller, smarter models designed for that reality. This shifts model design toward efficiency, benefiting mobile deployment.
_Source: [Vikas Chandra - On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/)_

### Innovation Opportunities for Tasmi'

| Opportunity | Timeframe | Impact |
|------------|-----------|--------|
| **Tajweed rule detection** — classify not just word errors but specific Tajweed violations | Phase 3+ | HIGH — unique differentiator |
| **Teacher mode** — let a human teacher use the app to track multiple students' progress | Post-launch | MEDIUM — expands to institutions |
| **Community recitation** — shared progress boards for study circles (halaqat) | Post-launch | MEDIUM — social engagement |
| **Apple Watch / wearable haptics** — vibration directly on wrist during recitation | Future | HIGH — most natural feedback modality |
| **Multimodal AI** — use device camera to follow text in a physical Mushaf while verifying audio | 2027+ | HIGH — bridges physical/digital |
| **Personalized voice model** — fine-tune on the individual user's recitation style over time | 2027+ | HIGH — dramatically improves accuracy |

## 7. Research Methodology and Sources

### Primary Sources

**Academic & Research:**
- [Speech Recognition Models for Holy Quran Recitation](https://thesai.org/Downloads/Volume14No12/Paper_97-Speech_Recognition_Models_for_Holy_Quran_Recitation.pdf)
- [Enhanced Neural Speech Recognition of Quranic Recitations](https://www.mdpi.com/2076-3417/15/17/9521)
- [Tasmeea Algorithm for Quranic Transcript Verification](https://www.emergentmind.com/topics/tasmeea-algorithm)
- [Diacritic-Based Matching of Arabic Words](http://www.jarrar.info/publications/JZAA18.pdf)
- [Arabic Speech Recognition: Advancement and Challenges (IEEE)](https://ieeexplore.ieee.org/document/10466536/)

**Industry Benchmarks & Guides:**
- [Northflank: Best Open Source STT Models 2026](https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks)
- [Deepgram: Best Speech-to-Text APIs 2026](https://deepgram.com/learn/best-speech-to-text-apis-2026)
- [Ionio: Edge Speech-to-Text Benchmark 2025](https://www.ionio.ai/blog/2025-edge-speech-to-text-model-benchmark-whisper-vs-competitors)
- [HuggingFace: Fine-Tune Whisper Guide](https://huggingface.co/blog/fine-tune-whisper)

**Platform Documentation:**
- [Flutter Architecture Guide](https://docs.flutter.dev/app-architecture/guide)
- [Quran Foundation API Documentation](https://api-docs.quran.foundation/)
- [Android Offline-First Architecture](https://developer.android.com/topic/architecture/data-layer/offline-first)
- [WhisperKit (Argmax)](https://github.com/argmaxinc/WhisperKit)
- [whisper.rn](https://github.com/mybigday/whisper.rn)

**Competitor Analysis:**
- [Tarteel Multi-Cloud Case Study](https://zeet.co/customers/case-study/tarteel-case-study)
- [Tarteel ML Journey](https://tarteel.ai/blog/tarteels-ml-journey-part-1-intro-data-collection/)
- [Sensor Tower Q1 2025 Quran App Performance](https://sensortower.com/blog/2025-q1-ios-top-5-books-units-mid_east-6042071f241bc16eb8c33b77)

### Research Quality Assessment

- **Confidence Level:** HIGH for core technical recommendations (ASR, Flutter, architecture). MEDIUM for fine-tuned WER estimates (depends on dataset quality and training approach)
- **Limitations:** Specific Quranic Arabic WER benchmarks are limited in public literature; most Arabic ASR research focuses on MSA or dialectal Arabic. Real-world performance will require prototyping and user testing
- **Areas for Further Investigation:** Tajweed-specific error detection, user testing with diverse recitation styles, battery impact profiling on mid-range devices

---

## Conclusion and Next Steps

### Summary of Key Findings

Tasmi' is **technically feasible and commercially viable** with current technology. The recommended Flutter + on-device Whisper + SQLite stack enables a fully offline, privacy-first Quran memorization verification app that can differentiate from the cloud-heavy market leader (Tarteel) on latency, offline capability, and privacy.

The Tasmeea Algorithm provides a published, proven approach for the core comparison logic. Fine-tuning Whisper on Quranic datasets is the highest-impact technical investment, potentially bringing accuracy close to Tarteel's 4% WER state-of-the-art.

### Recommended Next Steps

1. **Create a Product Brief** — use `bmad-bmm-create-product-brief` to formalize the product vision, target users, and success metrics
2. **Build a Proof of Concept** — audio capture → Whisper inference → text comparison → haptic output, just for Al-Fatiha
3. **Evaluate ASR accuracy** — test pre-trained Whisper Small on 10-20 common surahs to establish a baseline WER before fine-tuning
4. **Fine-tune Whisper** — use the HuggingFace pipeline with Buraaq/quran-audio-text-dataset to create a Quranic-optimized model
5. **Proceed to full BMAD planning** — Create PRD → Architecture → Epics & Stories → Sprint Planning

---

**Technical Research Completion Date:** 2026-03-18
**Research Period:** Comprehensive current technical analysis (March 2026)
**Source Verification:** All technical facts cited with current web sources
**Technical Confidence Level:** High — based on multiple authoritative technical sources

_This technical research document serves as an authoritative reference for building Tasmi' and provides strategic technical insights for informed decision-making throughout the product development lifecycle._

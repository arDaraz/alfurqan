# Stack Research

**Domain:** Cross-platform mobile Quran memorization app with on-device Arabic speech recognition
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH (core stack is well-established; speech recognition layer requires custom model work with less community precedent)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React Native | 0.83.2 | Cross-platform mobile framework | Tarteel (the leading Quran AI app) uses React Native. JavaScript ecosystem is broader than Dart/Flutter for integrating ML tooling. New Architecture (Fabric renderer, TurboModules) is now mandatory in SDK 55, closing the performance gap with Flutter. Larger talent pool. |
| Expo SDK | 55 | Managed development workflow | SDK 55 (Feb 2026) is current stable. New Architecture only. Expo Router, EAS Build/Update, OTA updates, and managed native modules drastically reduce native configuration burden. react-native-executorch (our core AI library) has first-class Expo support. |
| TypeScript | 5.x | Type safety | Non-negotiable for a project with complex audio/ML pipelines. Expo Router provides typed routes out of the box. |
| Expo Router | v7 | Navigation | File-based routing shipped with SDK 55. Deep linking, typed routes, layouts, and offline caching built in. Eliminates manual React Navigation configuration. |

**Confidence: HIGH** -- React Native + Expo is the standard production stack for cross-platform apps in 2026. Tarteel (direct competitor) validates this choice.

### On-Device Speech Recognition (THE Critical Layer)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| whisper.rn | 0.5.2 | React Native binding for whisper.cpp | Direct C++ binding to whisper.cpp gives maximum control over model loading, real-time streaming via `RealtimeTranscriber`, CoreML acceleration on iOS (3x+ speedup via ANE), and the ability to load custom GGML models -- including fine-tuned Arabic/Quran models. More mature and flexible than react-native-executorch for our specific use case. |
| whisper.cpp (via whisper.rn) | latest | Inference engine | The standard for on-device Whisper inference. Supports GGML model format, CoreML on iOS, Metal on iOS, and is actively maintained by ggml-org. |
| Silero VAD (via whisper.rn) | built-in | Voice Activity Detection | whisper.rn ships with Silero VAD integration. Detects when the user starts/stops speaking, enabling automatic segmentation of recitation into processable chunks without manual start/stop buttons. |
| tarteel-ai/whisper-base-ar-quran | -- | Fine-tuned Quran ASR model | Tarteel's open-source Whisper model fine-tuned on Quranic Arabic. WER of 5.75% on Quran recitation -- far better than generic Whisper Arabic. Needs GGML conversion for whisper.rn (convert via whisper.cpp tooling). Base model size ~145MB (quantized). |

**Confidence: MEDIUM** -- whisper.rn is proven for on-device Whisper, and tarteel-ai's model exists with good WER. The integration path (fine-tuned model -> GGML conversion -> whisper.rn -> real-time Arabic transcription) is technically sound but has limited community precedent for production Arabic Quran apps. This is the highest-risk layer and needs early prototyping.

#### Why whisper.rn over react-native-executorch

react-native-executorch (v0.7.2) is excellent and actively developed by Software Mansion. However, for this project whisper.rn is the better choice because:

1. **Custom model support**: whisper.rn loads any GGML model file directly. react-native-executorch requires PTE format conversion which is less documented for fine-tuned Whisper variants.
2. **CoreML acceleration**: whisper.rn has mature CoreML encoder support for iOS (3x speedup). Critical for real-time recitation feedback.
3. **Real-time streaming**: whisper.rn's `RealtimeTranscriber` with VAD is purpose-built for continuous speech processing. react-native-executorch's `useSpeechToText` is more oriented toward batch transcription.
4. **Proven with Arabic**: whisper.cpp (which whisper.rn binds) is widely used in Arabic ASR research and Quran-specific applications.

**Fallback**: If whisper.rn proves insufficient, react-native-executorch with a custom PTE-exported model is the backup path.

### Audio Pipeline

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo-audio | SDK 55 | Audio playback (Sheikh correction audio) | Expo's built-in audio module. Handles playback of pre-recorded correction audio files. Supports background audio, streaming, and precise seek. |
| @siteed/expo-audio-studio | latest | Real-time microphone capture | Comprehensive audio recording with real-time PCM streaming, dual-stream output (original + 16kHz for ASR), WAV format, and cross-platform consistency. Better than raw expo-audio for the microphone->ASR pipeline. |
| expo-file-system | SDK 55 | Audio file management | Managing downloaded Sheikh audio files, cached model files, and temporary recording buffers on device. |

**Confidence: MEDIUM-HIGH** -- expo-audio for playback is standard. @siteed/expo-audio-studio for real-time mic capture is newer but well-documented. The mic->PCM->whisper.rn pipeline needs testing.

### Quran Data and Content

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Quran Foundation API | v4 | Quran text, translations, audio metadata | The authoritative API behind quran.com. Provides word-by-word text with Uthmani script, audio segment timestamps (word-level start/end ms), and reciter metadata. Use for initial data seeding and sync. |
| quran-align (cpfair) | -- | Word-level audio timestamps | Open-source tool for generating precise word-level timestamps from reciter audio. Use to build the word-highlighting system during playback. |
| UthmanicHafs font | v2 | Quran text rendering | The standard digital Uthmani script font. TTF format, supports all Quranic characters including tashkeel (diacritics). Load as custom font in Expo. |
| everyayah.com | -- | Verse-by-verse and word-by-word Sheikh audio | Open archive of Quran recitations by 50+ reciters including Husary and Minshawi. Verse-level audio files for correction playback. Word-by-word files available for granular correction. |

**Confidence: HIGH** -- These are the standard, community-trusted Quran data sources used by virtually all Quran apps.

### State Management and Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zustand | 5.x | Client state management | Lightweight, hook-based, zero-boilerplate. The standard React Native state manager in 2025-2026. Perfect for session state, UI state, recitation progress tracking. |
| react-native-mmkv | 3.x | Fast persistent key-value storage | 30x faster than AsyncStorage. Synchronous reads. Use for persisting Zustand state (memorization progress, settings, streaks) via zustand-mmkv-storage adapter. Encryption support for user data. |
| WatermelonDB | 0.x | Local relational database (offline-first) | SQLite-backed reactive database designed for React Native. Use for storing Quran text corpus, recitation history, session data locally. Lazy-loading and observable queries prevent loading entire Quran text into memory. |
| Supabase | latest | Backend: auth, database, sync | Open-source Firebase alternative. Provides auth (email, Google, Apple sign-in), PostgreSQL database for user progress, and real-time sync. Official Expo integration. Free tier is generous for MVP. |

**Confidence: HIGH** -- Zustand + MMKV is the dominant RN state pattern. WatermelonDB is battle-tested for offline-first RN. Supabase is the standard BaaS for Expo apps.

### UI and Styling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| NativeWind | 4.1 | Tailwind CSS for React Native | Stable production release. Brings Tailwind utility classes to RN with native performance. Dark mode, CSS variables, animations, container queries. Use v4.1 (stable), not v5 (preview). |
| expo-haptics | SDK 55 | Haptic feedback | Built-in Expo module. Provides impact, notification, and selection haptics. Use impactHeavy for mistake detection, notificationSuccess for completion. No extra dependencies needed. |
| react-native-reanimated | 3.x | Animations | Word-by-word highlighting animations, progress transitions, celebration effects. Ships with Expo SDK 55. Hardware-accelerated. |
| expo-linear-gradient | SDK 55 | Gradient backgrounds | Spiritual/calming UI aesthetic with gradient overlays. |
| @shopify/flash-list | 1.x | Performant list rendering | For rendering long lists of surahs, ayahs, and recitation history. Replacement for FlatList with significantly better performance. |

**Confidence: HIGH** -- Standard, well-documented Expo/RN UI libraries.

### Infrastructure and DevOps

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| EAS Build | -- | Cloud builds for iOS/Android | Expo Application Services. Handles native builds without local Xcode/Android Studio setup. Code signing, app store submission. |
| EAS Update | -- | OTA updates | Push JavaScript updates without app store review. Critical for iterating on ASR accuracy thresholds, UI tweaks, and bug fixes. |
| Sentry (expo-sentry) | -- | Error tracking and performance | Track crashes, ANR, ASR failures, and performance metrics in production. Official Expo plugin. |

**Confidence: HIGH** -- EAS is the standard deployment pipeline for Expo apps.

## Installation

```bash
# Initialize Expo project
npx create-expo-app@latest tasmi --template blank-typescript

# Core framework
npx expo install expo-router expo-haptics expo-audio expo-file-system expo-notifications expo-linear-gradient

# UI
npx expo install nativewind tailwindcss react-native-reanimated @shopify/flash-list

# State and storage
npm install zustand react-native-mmkv zustand-mmkv-storage @nozbe/watermelondb

# Backend
npm install @supabase/supabase-js

# Speech recognition (requires dev client, not Expo Go)
npm install whisper.rn

# Audio capture
npm install @siteed/expo-audio-studio

# Dev dependencies
npm install -D typescript @types/react expo-dev-client
npx expo install expo-dev-client
```

Note: whisper.rn and WatermelonDB require native modules, so you must use Expo dev client (not Expo Go) from the start.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| React Native + Expo | Flutter | If team has Dart expertise. Flutter's Impeller renderer is excellent for custom UI. But Tarteel proves RN works for this domain, and the JS ML ecosystem is stronger. |
| whisper.rn | react-native-executorch | If you need the broader ExecuTorch ecosystem (LLMs, image models) or prefer a more declarative API. Less control over custom models but cleaner developer experience for standard use cases. |
| whisper.rn | Vosk | If you need smaller model sizes (~50MB) and are willing to sacrifice accuracy. Vosk's Arabic model accuracy is undocumented and likely worse than fine-tuned Whisper for Quranic Arabic. |
| whisper.rn | sherpa-onnx (react-native-sherpa-onnx) | If you want ONNX-based inference instead of GGML. Arabic language support is less documented. RN wrapper is newer and less battle-tested. |
| WatermelonDB | PowerSync | If you want built-in server sync without custom logic. PowerSync provides managed sync infrastructure but locks you into their service. |
| Supabase | Firebase | If you need more mature ML integration (Firebase ML) or prefer Google's ecosystem. Supabase is more developer-friendly, open-source, and has better PostgreSQL features. |
| NativeWind 4.1 | Tamagui | If you need a full design system with cross-platform web+mobile from day one. Heavier, more opinionated. NativeWind is lighter and more flexible. |
| Zustand | Jotai | If you prefer atomic state management. Both are lightweight; Zustand's persist middleware + MMKV integration is more documented for RN offline patterns. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Expo Go (for development) | whisper.rn and WatermelonDB require native modules that Expo Go cannot run. You will hit a wall immediately. | Expo Dev Client from day one |
| AsyncStorage | 30x slower than MMKV for read/write. No encryption. Async-only API causes unnecessary complexity. | react-native-mmkv |
| Redux / Redux Toolkit | Massive boilerplate for a project this size. Zustand provides the same capabilities with 1/10th the code. | Zustand |
| Google Cloud Speech-to-Text API | Requires internet connection, violates offline-first requirement, sends private Quran recitation to external servers, adds per-request cost. | whisper.rn (on-device) |
| react-native-voice | Wraps platform speech APIs (Siri/Google ASR). No custom model support, poor Arabic Quran accuracy, no word-level timestamps, inconsistent across platforms. | whisper.rn |
| expo-speech | Text-to-speech only, not speech-to-text. Wrong direction entirely. | whisper.rn for STT, expo-audio for playback |
| NativeWind v5 | Still in preview/pre-release. Breaking changes likely. Use the stable v4.1. | NativeWind 4.1.23 |
| React Native CLI (bare) | Losing all Expo benefits (EAS Build, OTA updates, managed native modules) for no gain. Every native module we need has Expo support. | Expo managed workflow with dev client |
| Generic Whisper models (non-Quran) | Generic Whisper base has ~14% CER on Arabic. The tarteel-ai fine-tuned model achieves 5.75% WER on Quran specifically. Using the wrong model means unusable accuracy. | tarteel-ai/whisper-base-ar-quran converted to GGML |

## Stack Patterns by Variant

**If Arabic ASR accuracy is insufficient with whisper-base:**
- Upgrade to tarteel-ai/whisper-small-ar-quran or whisper-medium-ar-quran
- Larger models trade size (~500MB-1.5GB) for accuracy
- Consider downloading model on first launch rather than bundling
- CoreML acceleration on iOS makes medium-size models viable

**If real-time word-by-word matching proves too slow:**
- Switch from full Whisper transcription to a phoneme-based approach
- Use a CTC (Connectionist Temporal Classification) model for forced alignment
- tarteel-ai has explored Whisper-large-v3 as speech-to-phoneme for mispronunciation detection
- This is a fundamentally different architecture -- would need Phase-specific research

**If WatermelonDB sync with Supabase is too complex:**
- Use PowerSync for managed sync
- Or simplify to MMKV for local-only storage with manual Supabase sync on connectivity changes
- The Quran text corpus is static (never changes), only user progress needs sync

**If the app needs web support later:**
- Expo Router supports web out of the box
- NativeWind works on web
- whisper.rn does NOT work on web -- would need whisper.cpp WASM build
- This should be deferred; project scope says mobile-first

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| expo@55.0.7 | react-native@0.83.2 | Must use New Architecture (no opt-out) |
| nativewind@4.1.23 | tailwindcss@3.4.17 | Do NOT use Tailwind 4.x yet with NativeWind |
| whisper.rn@0.5.2 | react-native@0.73+ | Requires New Architecture TurboModules. Test with 0.83. |
| @nozbe/watermelondb | react-native@0.73+ | Requires JSI. Compatible with New Architecture. |
| react-native-mmkv@3.x | react-native@0.73+ | Uses JSI, compatible with New Architecture |
| zustand@5.x | react@19.2 | Ships with Expo SDK 55 |
| react-native-reanimated@3.x | expo@55 | Pre-installed with Expo SDK 55 |
| @siteed/expo-audio-studio | expo@55 | Verify compatibility -- newer library |

## Model Deployment Strategy

The speech recognition model is the largest asset in the app. Strategy:

1. **Do NOT bundle the model in the app binary** -- it would make the app 150MB+ on download
2. **Download on first launch** -- show a one-time setup screen: "Downloading Quran recognition engine (145MB)"
3. **Store in app's document directory** -- persists across app updates
4. **Ship with expo-file-system** -- handles download progress, resumable downloads
5. **Cache CoreML encoder separately on iOS** -- whisper.rn loads `.mlmodelc` files alongside GGML for ANE acceleration

## Arabic Text Rendering Strategy

1. **Bundle UthmanicHafs TTF** in the app assets
2. **Use React Native's I18nManager** for RTL layout support
3. **Set `writingDirection: 'rtl'`** on all Quran text components
4. **Use `textAlign: 'right'`** for Arabic text alignment
5. **Test thoroughly on both platforms** -- Arabic text rendering has historically had edge cases in React Native

## Sources

- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- SDK version, React Native 0.83, New Architecture default (HIGH confidence)
- [React Native ExecuTorch Docs](https://docs.swmansion.com/react-native-executorch/) -- useSpeechToText API, Arabic language support, custom models (HIGH confidence)
- [whisper.rn GitHub](https://github.com/mybigday/whisper.rn) -- React Native Whisper binding, RealtimeTranscriber, CoreML, VAD (HIGH confidence)
- [tarteel-ai/whisper-base-ar-quran on HuggingFace](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) -- Fine-tuned Quran ASR model, 5.75% WER (HIGH confidence)
- [Tarteel AI Case Study on Zeet](https://zeet.co/customers/case-study/tarteel-case-study) -- Tarteel uses React Native, NVIDIA Riva/NeMo (MEDIUM confidence)
- [Quran Foundation API Docs](https://api-docs.quran.foundation/) -- Audio segments with word timestamps (HIGH confidence)
- [NativeWind v4 Docs](https://www.nativewind.dev/) -- Tailwind for React Native, v4.1 stable (HIGH confidence)
- [Zustand + MMKV articles](https://dev.to/mehdifaraji/zustand-mmkv-storage-blazing-fast-persistence-for-zustand-in-react-native-3ef1) -- State persistence pattern (MEDIUM confidence)
- [WatermelonDB + Supabase guide](https://supabase.com/blog/react-native-offline-first-watermelon-db) -- Offline-first sync architecture (MEDIUM confidence)
- [Expo Blog: Real-time audio processing](https://expo.dev/blog/real-time-audio-processing-with-expo-and-native-code) -- Audio pipeline architecture (MEDIUM confidence)
- [everyayah.com](https://www.everyayah.com/) -- Verse-by-verse Quran audio files (HIGH confidence)
- [quran-align GitHub](https://github.com/cpfair/quran-align) -- Word-level audio timestamps (MEDIUM confidence)
- [Adapting Whisper-large-v3 for Quran (ACL 2025)](https://aclanthology.org/2025.arabicnlp-sharedtasks.64.pdf) -- Academic research on Whisper for Quran mispronunciation (MEDIUM confidence)
- [whisper.cpp Model Conversion](https://deepwiki.com/ggml-org/whisper.cpp/5.1-model-download-and-conversion) -- GGML format conversion for custom models (HIGH confidence)
- [HifzPath](https://hifzpath.pages.dev/) -- Competitor using on-device speech recognition for Quran memorization (MEDIUM confidence)

---
*Stack research for: Cross-platform mobile Quran memorization app with on-device Arabic speech recognition*
*Researched: 2026-03-18*

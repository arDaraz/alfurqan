# Project Research Summary

**Project:** Tasmi' -- Digital Quran Memorization Partner
**Domain:** Cross-platform mobile Quran memorization app with on-device Arabic speech recognition
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH

## Executive Summary

Tasmi' is a cross-platform mobile app that digitizes the musahih (Quran recitation listener/corrector) role. The product is technically ambitious: it requires on-device Arabic speech recognition tuned for Quranic text, real-time word-by-word alignment, haptic and audio correction feedback, and a large corpus of word-level Sheikh recordings -- all running offline on mobile devices. Experts in this space (Tarteel AI being the primary reference) use React Native with cloud-based speech recognition. Tasmi' differentiates by moving recognition on-device, which is technically harder but delivers zero-latency correction, full offline operation, and complete privacy. No competitor currently achieves this on native mobile.

The recommended approach is React Native + Expo SDK 55 for the shell, whisper.rn binding whisper.cpp for on-device speech recognition using Tarteel's open-source fine-tuned Quran model (5.75% WER), and a pipeline architecture where audio flows from microphone capture through speech-to-text, word matching (sliding window edit distance), and feedback dispatch. The stack is well-established except for the speech recognition layer, which has limited production precedent for Arabic Quran apps on-device. This layer is the critical path and the highest-risk component -- it must be prototyped and validated before any dependent feature is built.

The key risks are (1) false positive mistake detection destroying user trust -- the single most damaging failure mode, evidenced by Tarteel's negative App Store reviews, (2) Arabic text rendering breaking on real devices -- a known cross-platform framework issue with fully diacritized Quranic text, (3) model memory consumption crashing budget Android devices common in Muslim-majority markets, and (4) word-level audio asset management at scale (~77,000 clips per reciter at ~1.9GB each). Mitigation requires starting with high tolerance thresholds (missing real mistakes is less harmful than false corrections), testing on physical devices from day one, targeting the Whisper-tiny quantized model for broad device support, and designing progressive audio download architecture before implementing corrections.

## Key Findings

### Recommended Stack

The core framework is React Native 0.83.2 with Expo SDK 55 (New Architecture mandatory), TypeScript, and Expo Router v7 for file-based navigation. This is the standard production stack for cross-platform apps in 2026, validated by Tarteel (direct competitor) using React Native. The speech recognition layer uses whisper.rn (C++ binding to whisper.cpp) with Tarteel's open-source whisper-base-ar-quran model converted to GGML format. whisper.rn was chosen over react-native-executorch for its superior custom model support, CoreML acceleration on iOS, and built-in streaming with Silero VAD. See STACK.md for full rationale.

**Core technologies:**
- **React Native + Expo SDK 55:** Cross-platform framework -- Tarteel validates this choice; JS ecosystem stronger for ML tooling
- **whisper.rn + whisper.cpp:** On-device speech recognition -- direct C++ binding, custom GGML model loading, CoreML acceleration, real-time streaming with VAD
- **tarteel-ai/whisper-base-ar-quran:** Fine-tuned Quran ASR model -- 5.75% WER on Quran recitation vs 14% CER for generic Arabic Whisper; needs GGML conversion (~145MB quantized)
- **Zustand + react-native-mmkv:** State management and persistence -- 30x faster than AsyncStorage, synchronous reads, encryption support
- **WatermelonDB:** Offline-first local database -- SQLite-backed, reactive queries, lazy loading for Quran text corpus
- **Supabase:** Backend auth, database, and sync -- open-source, official Expo integration, generous free tier
- **NativeWind 4.1:** Tailwind CSS for React Native -- stable release, dark mode and CSS variables built in (do NOT use v5 preview)
- **@siteed/expo-audio-studio:** Real-time microphone capture -- dual-stream output for ASR pipeline

**Critical version requirements:** Expo SDK 55 mandates New Architecture (no opt-out). NativeWind must use v4.1 with Tailwind 3.4.x (not Tailwind 4.x). whisper.rn requires dev client from day one (not Expo Go). WatermelonDB and MMKV both require JSI.

### Expected Features

The feature landscape was mapped against competitors (Tarteel, Tasmee/Eqra, Mathani, HifzPath). See FEATURES.md for the full prioritization matrix and competitor analysis.

**Must have (table stakes -- P1 for launch):**
- Quran text display with Uthmani script and proper RTL rendering
- Surah/ayah range selection for recitation sessions
- On-device speech recognition for Arabic Quranic recitation
- Word-by-word matching with real-time highlighting during recitation
- Mistake detection with instant haptic feedback
- Sheikh audio correction playback at word level (start with 1-2 Qaris)
- Basic session history (what was practiced, when, accuracy)
- Full offline operation

**Should have (differentiators -- P2 post-validation):**
- User accounts and cloud sync (trigger: users asking to transfer progress)
- Progress dashboard with memorization heatmap
- Multiple Qari options (5+)
- Daily streaks and practice reminders
- Accuracy scoring trends per surah
- Milestone celebrations (juz/surah completion)
- Dark mode

**Defer (v2+):**
- Spaced repetition for muraja'ah (review scheduling)
- Adaptive difficulty (progressive text hiding)
- Tajweed color-coding on displayed text
- Kids mode, family/group plans
- Recording and playback of user recitation
- Web version

**Anti-features (deliberately avoid):**
- Leaderboards/social competition (cheapens spiritual practice)
- Tajweed rule detection at letter level (60-70% accuracy -- not production-ready)
- Auto-detect mode (harder technically, unnecessary for hifz workflow)
- TTS corrections (robotic, disrespectful for sacred text)
- Social sharing of progress (risk of riyaa)

### Architecture Approach

The architecture follows a layered pipeline pattern: Presentation Layer (screens) -> Application Layer (Recitation Engine orchestrator, Progress Tracker, Audio Player) -> Processing Layer (Word Matcher using edit distance, Feedback Engine) -> Native Bridge Layer (Audio Capture, Speech-to-Text via JSI/TurboModules, Haptics) -> Data Layer (Quran text SQLite, Progress SQLite with sync, Audio assets). The Recitation Engine is the central orchestrator. All latency-critical paths use JSI for zero-serialization data transfer. The target is under 500ms end-to-end from speech to feedback. See ARCHITECTURE.md for component details, data flows, and project structure.

**Major components:**
1. **Recitation Engine** -- Orchestrates the full recitation pipeline: starts audio capture, receives transcriptions, runs word matching, dispatches feedback. This is the "brain" of the app.
2. **Word Matcher** -- Compares ASR output against reference Quran text using normalized sliding window edit distance (Tasmeea algorithm, 0.5 threshold). Handles ASR imperfections gracefully.
3. **Speech-to-Text (whisper.rn)** -- Runs Whisper model inference on audio chunks via native C++ binding. Platform-agnostic interface abstracts iOS CoreML vs Android backends.
4. **Feedback Engine** -- Triggers haptic vibration and correction audio playback when mistakes are detected. Bridges to native APIs.
5. **Quran Data Layer** -- Bundled SQLite database with word-level Quran text, Uthmani encoding, and metadata. Static corpus that never changes.
6. **Audio Asset Manager** -- Progressive download system for word-level Sheikh recordings organized by reciter/surah/ayah/word. Must support resume, checksums, and storage management.

### Critical Pitfalls

The top 5 pitfalls from PITFALLS.md, ranked by potential damage. See PITFALLS.md for the full list of 7 critical pitfalls plus technical debt patterns, UX pitfalls, and recovery strategies.

1. **False positive mistake detection destroys user trust** -- Default to higher tolerance (fewer false corrections); implement configurable sensitivity; use two-threshold system (high-confidence = instant correction, medium = logged, low = ignored); target less than 2% false positive rate on correct recitation. This is the number one risk.
2. **Arabic text rendering breaks on real devices** -- Fully diacritized Quranic Uthmani text is the most demanding Arabic rendering scenario. Test on 8+ physical devices including budget Android. Use KFGQPC Uthmani Hafs font with explicit RTL settings. Have pre-rendered page images as emergency fallback.
3. **On-device model crashes low-end devices** -- Whisper-tiny needs 900MB RAM on Android via ExecuTorch. Target devices with 3GB RAM minimum. Use INT8 quantization. Lazy-load model only during recitation. Profile memory continuously.
4. **Word-level audio asset management becomes unmanageable** -- 77,429 words per reciter at ~1.9GB. Must implement progressive download (surah-by-surah) from day one. Use Opus codec for 50-60% size reduction. Never bundle audio in app binary.
5. **Real-time word tracking loses sync** -- Use streaming ASR (not batch), constrain recognition to expected next N words, add deliberate 200-300ms highlighting delay for consistency, provide manual "I am here" re-anchor tap. Test across full-length suwar at varying speeds.

## Implications for Roadmap

Based on combined research, the build order is dictated by a strict dependency chain: speech recognition is the critical path, and every differentiating feature depends on it working. The architecture research explicitly identifies a 7-step build order. Here is the suggested phase structure.

### Phase 1: Foundation and Data Layer
**Rationale:** Everything depends on the Quran data being available with word-level structure, and the Quran text rendering working correctly on real devices. Arabic text rendering is a known cross-platform pitfall that must be validated early -- it is a gating decision. This phase has zero dependencies and de-risks the most visible component.
**Delivers:** Bundled Quran SQLite database with word-level metadata; Quran text display with Uthmani font and proper RTL; surah/ayah/juz navigation; word-level tap interactivity; app skeleton with Expo Router, NativeWind, Zustand/MMKV.
**Addresses features:** Quran text display, surah/ayah selection, beautiful UI foundation, bookmarking/resume.
**Avoids pitfall:** Arabic text rendering breakage (test on real devices immediately).

### Phase 2: Speech Recognition Proof-of-Concept
**Rationale:** This is the highest-risk technical component and the core differentiator. It must be proved out before building any dependent features. The architecture research, feature research, and pitfalls research all identify this as the critical path. Failure here changes the entire product strategy.
**Delivers:** Working on-device Arabic Quran speech recognition via whisper.rn with tarteel-ai model in GGML format; audio capture pipeline via expo-audio-studio; basic transcription output validated against known ayahs; model download and caching system; device compatibility matrix.
**Addresses features:** On-device speech recognition (core differentiator), offline functionality.
**Avoids pitfalls:** Model size crashes on low-end devices (test on 3GB RAM devices); sensitivity calibration across recitation styles (test with diverse reciters early).

### Phase 3: Core Recitation Loop
**Rationale:** With speech recognition working, connect it to the word matching algorithm and feedback system. This phase brings the core product experience together -- the "digital musahih" interaction. The Recitation Engine orchestrator, Word Matcher, and Feedback Engine are tightly coupled and should be built together.
**Delivers:** Complete recitation pipeline (audio capture -> STT -> word matching -> feedback); real-time word-by-word highlighting during recitation; mistake detection with haptic feedback; basic accuracy scoring per session.
**Addresses features:** Word-by-word matching and highlighting, mistake detection with haptic feedback, zero-latency correction loop, real-time word highlighting.
**Avoids pitfalls:** False positive corrections (tune thresholds with 20+ test reciters); word tracking sync loss (implement sliding window alignment, deliberate delay, re-anchor).

### Phase 4: Sheikh Audio Correction System
**Rationale:** The correction audio is what transforms the app from a mistake detector into a digital teacher. However, it requires a significant audio asset infrastructure (progressive download, word-level segmentation, storage management) that must be designed properly from the start. This cannot be retrofitted.
**Delivers:** Word-level Sheikh audio correction playback on mistake detection; progressive audio download system (surah-by-surah); audio segmentation pipeline using quran-align; storage management UI; support for 1-2 Qaris (Husary, Minshawi).
**Addresses features:** Sheikh audio correction at word level, audio recitation playback, multiple Qari options (initial 1-2).
**Avoids pitfall:** Audio asset management becoming unmanageable (progressive download, Opus compression, resume support).

### Phase 5: Session Tracking and Progress
**Rationale:** With the core recitation loop complete and generating session results, progress features become meaningful. These are lower risk with standard implementation patterns.
**Delivers:** Session history (what was practiced, when, accuracy scores); basic progress tracking per surah/ayah; local persistence of all progress data via WatermelonDB; offline-first operation validated end-to-end.
**Addresses features:** Progress tracking, basic session history, accuracy scores, offline operation.

### Phase 6: Accounts, Sync, and Polish
**Rationale:** User accounts and cloud sync are explicitly not blocking for core functionality. The offline-first architecture means the app works fully without accounts. This phase layers cloud capabilities on top of a validated core experience.
**Delivers:** User authentication (email, Apple, Google sign-in) via Supabase; cloud sync of progress data; daily streaks and practice reminders; milestone celebrations; progress dashboard with heatmap; dark mode; multiple Qari expansion (5+); production polish pass.
**Addresses features:** User accounts and cloud sync, daily practice streaks, milestone celebrations, progress dashboard, dark mode, multiple Qari options.

### Phase 7: Launch Preparation
**Rationale:** Final hardening before public release. Focus on device compatibility testing, performance optimization, error tracking, and App Store requirements.
**Delivers:** EAS Build pipeline for iOS and Android; Sentry error tracking; performance profiling on target device matrix; App Store and Play Store listing; microphone permission copy; privacy policy; OTA update infrastructure via EAS Update.

### Phase Ordering Rationale

- **Phases 1-2 in sequence** because speech recognition depends on having Quran text data for matching, and Phase 1 de-risks Arabic rendering which is a framework-level concern.
- **Phase 2 before Phase 3** because the recitation loop cannot be built without validated speech recognition. If Phase 2 fails (model accuracy insufficient, device compatibility issues), the project needs to pivot (e.g., cloud fallback, different model architecture).
- **Phase 3 before Phase 4** because correction audio playback depends on the word matcher knowing which word was wrong.
- **Phase 4 is separated from Phase 3** because the audio asset infrastructure is a distinct, significant engineering effort (progressive download, segmentation, storage management) that should not be conflated with the core matching algorithm work.
- **Phase 5 after Phase 3-4** because progress tracking is meaningless without completed recitation sessions generating real data.
- **Phase 6 last (before launch prep)** because accounts/sync are enhancement, not core. Users should be able to use the app fully offline before this exists.
- The dependency chain from FEATURES.md confirms this: Speech Recognition -> Word Matching -> Mistake Detection -> Haptic/Audio Feedback -> Accuracy Scoring -> Progress Dashboard.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Speech Recognition Proof-of-Concept):** NEEDS RESEARCH. The integration path (tarteel-ai model -> GGML conversion -> whisper.rn -> real-time Arabic transcription) has limited community precedent. Model conversion, CoreML encoder setup, streaming configuration, and device compatibility all need hands-on investigation. This is the phase most likely to surface unexpected blockers.
- **Phase 3 (Core Recitation Loop):** NEEDS RESEARCH. The word matching algorithm (Tasmeea-inspired sliding window edit distance) is documented in academic literature but has limited open-source production implementations. Threshold tuning for false positive rate is empirical work.
- **Phase 4 (Sheikh Audio Correction System):** NEEDS RESEARCH. Word-level audio segmentation quality (quran-align reports ~73ms average error), progressive download architecture design, and Opus encoding pipeline all need investigation.

Phases with standard patterns (skip deep research):
- **Phase 1 (Foundation and Data Layer):** Standard Expo/React Native setup with SQLite. Well-documented patterns. Quran Foundation API and Tanzil provide the data. Main risk is Arabic rendering which needs device testing, not research.
- **Phase 5 (Session Tracking and Progress):** Standard CRUD with WatermelonDB. Well-established offline-first patterns.
- **Phase 6 (Accounts, Sync, and Polish):** Standard Supabase auth + sync. Documented in Supabase + Expo official guides.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | React Native + Expo is the dominant cross-platform stack. Every library chosen is well-maintained with official Expo support. Tarteel (direct competitor) validates React Native for this domain. |
| Stack (Speech Recognition) | MEDIUM | whisper.rn and tarteel-ai model each proven individually. The specific integration path (fine-tuned Quran model in GGML format via whisper.rn with real-time Arabic streaming) has limited production precedent. |
| Features | HIGH | Feature landscape mapped against 6+ competitors with direct analysis of user reviews and published feature lists. Table stakes are clear. Differentiators are grounded in real competitor gaps. |
| Architecture | MEDIUM-HIGH | Pipeline architecture is sound and validated by Tarteel's NVIDIA case study and the Tasmeea algorithm research. The word matching algorithm has academic backing. Project structure follows established Expo/RN patterns. Latency budget (sub-500ms) needs on-device validation. |
| Pitfalls | HIGH | Pitfalls sourced from competitor App Store reviews (real user complaints), academic research on Arabic ASR accuracy, Flutter/RN framework issue trackers (real bugs), and known device compatibility constraints. |

**Overall confidence:** MEDIUM-HIGH

The overall confidence is MEDIUM-HIGH rather than HIGH because the on-device speech recognition layer -- the core differentiator -- has limited production precedent for Arabic Quran apps. The individual components (whisper.rn, whisper.cpp, tarteel-ai model) are each proven, but their specific integration for real-time Quran recitation matching on mobile has not been widely documented. Phase 2 will resolve this uncertainty.

### Gaps to Address

- **GGML model conversion quality:** Tarteel's model is published in Hugging Face format. Converting to GGML for whisper.rn may affect accuracy. Needs empirical validation during Phase 2.
- **whisper.rn streaming latency on Android:** CoreML gives 3x speedup on iOS. Android performance with whisper.cpp alone is less documented for real-time use. Needs device testing.
- **Word-level audio segmentation quality:** quran-align reports ~73ms average error per word boundary. Whether this produces clips that sound natural (not clipped mid-consonant) needs validation before committing to individual word clips vs. ayah-level audio with timestamp-based slicing.
- **Memory budget on 3GB Android devices:** Whisper-tiny needs ~900MB via ExecuTorch. whisper.rn with GGML quantization may be more efficient, but actual memory consumption in a full app context (with audio player, text rendering, UI) is unknown until profiled.
- **@siteed/expo-audio-studio compatibility with Expo SDK 55:** Newer library, needs verification. Fallback is raw expo-audio with manual PCM stream handling.
- **Edit distance threshold tuning:** The Tasmeea algorithm uses 0.5 as match threshold. Whether this works for diverse accents and recitation speeds needs empirical testing with real users during Phase 3.
- **Word-level audio licensing:** everyayah.com audio is available but licensing terms for word-level redistribution in a commercial app need legal review.

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- SDK version, React Native 0.83, New Architecture
- [whisper.rn GitHub](https://github.com/mybigday/whisper.rn) -- React Native Whisper binding, streaming, CoreML, VAD
- [tarteel-ai/whisper-base-ar-quran](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) -- Fine-tuned Quran ASR model, 5.75% WER
- [Quran Foundation API Docs](https://api-docs.quran.foundation/) -- Quran text data, word-level timestamps, audio segments
- [NativeWind v4 Docs](https://www.nativewind.dev/) -- Tailwind CSS for React Native
- [whisper.cpp GitHub](https://github.com/ggml-org/whisper.cpp) -- On-device Whisper inference engine
- [WhisperKit GitHub](https://github.com/argmaxinc/WhisperKit) -- iOS-optimized on-device ASR
- [Expo Docs: Local-first Architecture](https://docs.expo.dev/guides/local-first/) -- Offline-first patterns
- [everyayah.com](https://www.everyayah.com/) -- Verse-by-verse Quran audio files
- [NVIDIA/Tarteel Case Study](https://www.nvidia.com/en-us/case-studies/automating-real-time-arabic-speech-recognition/) -- Tarteel architecture

### Secondary (MEDIUM confidence)
- [Tasmeea Algorithm for Quranic Transcript Verification](https://www.emergentmind.com/topics/tasmeea-algorithm) -- Sliding window edit distance approach
- [Tarteel Zeet Case Study](https://zeet.co/customers/case-study/tarteel-case-study) -- Tarteel uses React Native
- [Zustand + MMKV persistence pattern](https://dev.to/mehdifaraji/zustand-mmkv-storage-blazing-fast-persistence-for-zustand-in-react-native-3ef1) -- State persistence
- [WatermelonDB + Supabase guide](https://supabase.com/blog/react-native-offline-first-watermelon-db) -- Offline-first sync
- [quran-align GitHub](https://github.com/cpfair/quran-align) -- Word-level audio timestamps (~73ms accuracy)
- [Bloomberg Streaming Whisper](https://www.bloomberg.com/company/stories/bloombergs-ai-researchers-turn-whisper-into-a-true-streaming-asr-model-at-interspeech-2025/) -- Two-pass streaming approach
- [Callstack: Real-Time Audio Pipelines in React Native](https://www.callstack.com/blog/from-files-to-buffers-building-real-time-audio-pipelines-in-react-native) -- Audio architecture
- [Mispronunciation Detection of Quranic Recitation Rules (arXiv)](https://arxiv.org/abs/2305.06429) -- Tajweed detection accuracy (60-70%)
- [Adapting Whisper-large-v3 for Quran (ACL 2025)](https://aclanthology.org/2025.arabicnlp-sharedtasks.64.pdf) -- Academic Quran ASR research
- [Evaluating ASR Confidence Scores for Error Detection (arXiv)](https://arxiv.org/html/2503.15124v1) -- Confidence calibration issues

### Tertiary (needs validation)
- [Tarteel App Store Reviews](https://justuseapp.com/en/app/1391009396/tarteel-recite-al-quran/reviews) -- User complaints about false positives
- [@siteed/expo-audio-studio](https://github.com/nicksiteed/expo-audio-studio) -- Newer library, verify SDK 55 compatibility
- [HifzPath](https://hifzpath.pages.dev/) -- Browser-based competitor using Web Speech API
- [Whisper Model Sizes Explained](https://openwhispr.com/blog/whisper-model-sizes-explained) -- Model size estimates

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*

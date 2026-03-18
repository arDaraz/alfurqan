# Pitfalls Research

**Domain:** Quran memorization mobile app with on-device Arabic speech recognition
**Researched:** 2026-03-18
**Confidence:** HIGH (informed by competitor analysis, academic research, platform issue trackers, and user reviews)

## Critical Pitfalls

### Pitfall 1: False Positive Mistake Detection Destroys User Trust

**What goes wrong:**
The speech recognition flags correct recitation as incorrect. The user recites an ayah perfectly, but the app triggers haptic feedback and plays a "correction" audio clip for a word they said correctly. This is the single most damaging failure mode for a Quran memorization app. Users who are Huffaz or advanced memorizers will immediately lose trust in the app and uninstall. Tarteel's App Store reviews are filled with exactly this complaint: "the app sometimes revisits words it previously marked as correct and later claims they were mistakes."

**Why it happens:**
- Confidence thresholds for word matching are set too low, causing the model to reject words that were actually spoken correctly but with slight accent or pronunciation variation
- Whisper and similar ASR models produce confidence scores that are poorly calibrated -- a model assigning 80% confidence may not actually be correct 80% of the time
- Quranic Arabic has specific phonetic characteristics (emphatic consonants, tajweed elongations, nasal sounds) that generic Arabic ASR models struggle to distinguish
- Background noise, breathing sounds, or page-turning can be misinterpreted as speech input
- Research shows that confidence-based error detection "neither improved correction efficiency nor was perceived as helpful by participants" when calibration is poor

**How to avoid:**
- Default to HIGHER tolerance (fewer false corrections) rather than catching every mistake. Missing a real mistake is far less damaging than falsely correcting correct recitation
- Implement a configurable sensitivity slider so users can tune strictness to their level (beginner vs. hafiz in review)
- Use a two-threshold system: high-confidence mistakes get instant correction, medium-confidence mistakes get logged but not interrupted, low-confidence gets ignored
- Test with diverse reciters: different accents (Egyptian, Gulf, South Asian, Southeast Asian, North African), different speeds (hadr, tahqeeq, tadweer), different voice types
- Build an "I recited correctly" feedback button so users can flag false positives, creating a correction loop

**Warning signs:**
- During testing, the app interrupts users more than 1-2 times per page when reciting known material correctly
- User testers express frustration or distrust during sessions
- The model flags the same common words repeatedly across different users
- Beta users disable mistake detection or stop using it

**Phase to address:**
Core speech recognition phase. This must be the primary quality metric from day one. Do not ship mistake detection until false positive rate is below an acceptable threshold (target: less than 2% of correctly recited words flagged).

---

### Pitfall 2: Arabic Text Rendering Breaks on Real Devices

**What goes wrong:**
Quranic text with full diacritical marks (tashkeel/harakat) renders incorrectly on certain devices. Characters overlap, diacritics misalign, words truncate, or ligatures break. This is not a theoretical concern -- Flutter has over a dozen open GitHub issues specifically about Arabic diacritics rendering (#16886, #54529, #143975, #119805, #78780). React Native has its own RTL text rendering bugs. Samsung devices historically truncated the first characters of Arabic verse lines. The Quran Foundation uses 604 separate page-specific fonts for their web rendering because a single font cannot reliably render the entire Mushaf.

**Why it happens:**
- Arabic text shaping is inherently complex: right-to-left direction, contextual letter forms (initial/medial/final/isolated), mandatory ligatures, and stacking diacritics
- Quranic text is among the most demanding Arabic rendering because it uses FULL diacritization -- nearly every letter has a tashkeel mark (fatha, damma, kasra, sukun, shadda, tanween, madd)
- Cross-platform frameworks (Flutter, React Native) rely on platform text renderers that have inconsistent Arabic support
- Flutter's Impeller rendering engine has known issues with Arabic text (issue #119805)
- Custom Uthmani fonts like KFGQPC may not render consistently across all device OEMs
- Font fallback chains on Android vary by manufacturer (Samsung, Xiaomi, Huawei all differ)

**How to avoid:**
- Test Arabic text rendering on at minimum: 3 iOS devices (different generations), 5 Android devices (Samsung, Pixel, Xiaomi, Huawei, budget device), covering OS versions 2-3 years back
- Use the Uthmani Hafs font from King Fahd Complex (KFGQPC) as primary, with a compatible fallback
- Consider pre-rendered page images as fallback for devices where font rendering fails (this is what many production Quran apps do)
- If using Flutter: test with both Skia and Impeller backends; stick with Skia for Arabic text if Impeller has issues
- If using React Native: test Text component with writingDirection 'rtl' explicitly set; do not rely on auto-detection
- Build a visual regression test suite for ayah rendering across devices early

**Warning signs:**
- Diacritics appear shifted or detached from their base letters
- Long ayahs wrap incorrectly or overflow their containers
- Specific suwar render differently on different devices
- Users in beta report "the text looks wrong" or "this is not the correct mushaf style"

**Phase to address:**
UI foundation phase. Arabic text rendering must be proven on real devices before building features on top of it. This is a gating decision for framework choice (Flutter vs. React Native).

---

### Pitfall 3: Word-Level Audio Asset Management Becomes Unmanageable

**What goes wrong:**
The app needs word-level Sheikh audio clips for corrections across the entire Quran. The Quran has approximately 77,429 words. Even at compressed MP3 quality, a single reciter's word-level audio is approximately 1.9GB. Supporting multiple Qaris (Husary, Minshawi as specified in requirements) multiplies this. Bundling all audio in the app download creates a 4-8GB app that nobody will install. Progressive downloading without proper management leads to incomplete audio libraries, broken correction playback, and confused storage states.

**Why it happens:**
- Developers underestimate the total corpus size: 77,429 individual word clips per reciter
- Naive approach of bundling everything in the app binary hits App Store size limits (Apple warns about apps over 200MB; Google Play limits to 150MB APK + 2GB expansion files)
- Without a proper download manager, partial downloads due to connectivity loss leave the audio library in an inconsistent state
- Users run out of device storage and the app has no graceful degradation strategy
- Word-level segmentation of existing Sheikh recordings requires precise alignment (average error of 73ms per the quran-align tool), and poor segmentation means correction clips start/end mid-sound

**How to avoid:**
- Design a progressive download architecture from day one: ship the app with zero audio, download surah-by-surah or juz-by-juz based on what the user is memorizing
- Use a robust download manager with resume capability, integrity verification (checksums), and clear progress UI
- Implement storage management: show users how much space each Qari occupies, let them delete unused suwar, display total app storage usage
- Compress audio aggressively: use Opus codec at 48kbps instead of MP3 for 50-60% size reduction with better quality
- Pre-generate word-level timestamps using quran-align or Whisper-based forced alignment, and validate segmentation quality before shipping each reciter
- Consider ayah-level audio with word-level timestamps as an alternative to individual word clips (smaller total size, simpler management, but requires real-time audio slicing)

**Warning signs:**
- App download size exceeds 200MB
- Users report "downloading audio" taking too long or failing
- Correction audio clips sound clipped or include parts of adjacent words
- Storage usage complaints in app reviews

**Phase to address:**
Audio infrastructure phase. Design the download and storage architecture before implementing the correction feature. This is architectural -- retrofitting a progressive download system is expensive.

---

### Pitfall 4: On-Device Model Size and Memory Crashes Low-End Devices

**What goes wrong:**
The on-device Whisper model consumes too much RAM, causing the app to crash on mid-range and budget Android devices -- precisely the devices most common in Muslim-majority markets (South Asia, Southeast Asia, Middle East, Africa). React Native ExecuTorch's Whisper tiny multilingual model requires 900MB RAM on Android and 600MB on iOS. Combined with the app's own memory usage, Quran text rendering, and audio playback, this easily exceeds the 2GB RAM budget of budget Android devices.

**Why it happens:**
- Developers test on flagship devices (iPhone 15 Pro, Pixel 8) where everything runs smoothly, but the target demographic often uses devices with 3-4GB total RAM
- Whisper-base (140M parameters) is too large for many mobile devices; even Whisper-tiny (39M parameters) needs 900MB on Android via ExecuTorch
- Running ASR inference concurrently with audio playback, UI rendering, and text display multiplies memory pressure
- Android's aggressive memory management kills background processes, and if the ASR model holds too much memory, the OS may kill the app during a recitation session
- On-device inference performance varies dramatically: "50 tokens/second on a flagship phone but 5 tokens/second on a mid-range device"

**How to avoid:**
- Target Whisper-tiny (not base or small) and apply INT8 quantization -- ExecuTorch v0.6.0 supports quantized Whisper models at "4x smaller file sizes without significant accuracy tradeoffs"
- Set minimum device requirements explicitly and test on budget devices from day one (target: devices with 3GB RAM)
- Implement memory monitoring and graceful degradation: if memory pressure is high, fall back to cloud-based recognition
- Profile memory usage continuously during development: ASR model + audio player + text renderer + UI must fit within 1.5GB total
- Consider CoreML backend on iOS (uses Neural Engine, much more memory-efficient) and NNAPI/GPU delegate on Android
- Lazy-load the ASR model only during active recitation sessions, unload immediately after

**Warning signs:**
- App crashes during recitation on mid-range devices
- ANR (Application Not Responding) errors on Android
- Significant lag between speaking and word highlighting
- Memory warnings in device console during testing

**Phase to address:**
Speech recognition integration phase. Device compatibility testing must happen before feature development. Define minimum supported device specs early.

---

### Pitfall 5: Sensitivity Calibration Fails Across Recitation Styles

**What goes wrong:**
The ASR model is trained or tuned for one recitation style and fails on others. Quranic recitation has three recognized speeds (hadr/fast, tadweer/moderate, tahqeeq/slow), multiple riwayat (Hafs, Warsh, Qalun, etc.), and significant accent variation across the Muslim world. A model calibrated for Egyptian-accented tahqeeq recitation will produce excessive false positives when a South Asian user recites in hadr style. Research shows accuracy drops from 90% for letter pronunciation to 60% when combining pronunciation and tajweed rules.

**Why it happens:**
- Training data is biased toward professional reciters (Qaris) rather than average users who are learning
- The model overfits to a specific recitation tempo or accent profile
- Tarteel's own training dataset of 75,000 minutes is likely dominated by certain demographics
- Developers who are familiar with one recitation tradition may not realize how different others sound
- Testing with a small, homogeneous group of testers masks the problem

**How to avoid:**
- Collect or source training data from diverse reciters: different nationalities, ages, genders, experience levels, recitation speeds
- Start with word-level matching (correct word or not) before attempting tajweed-level detection -- the research clearly shows tajweed accuracy is much lower (60-70% vs 90%+ for word-level)
- Allow users to do a calibration session where they recite known ayahs so the system can adjust its confidence thresholds
- Explicitly scope v1 to word-level accuracy only. Do not promise tajweed checking -- it is an unsolved research problem at production quality
- Test with at least 20 diverse reciters before each release

**Warning signs:**
- Accuracy metrics differ significantly between test groups (e.g., Arab native speakers vs. non-native)
- Certain suwar or ayahs have consistently higher error rates
- Users from specific regions report the app "does not understand me"
- Model works well in quiet testing but fails in real-world conditions (echoing rooms, outdoor noise)

**Phase to address:**
Speech recognition training/fine-tuning phase. Diversity of training data and test subjects must be a requirement, not an afterthought.

---

### Pitfall 6: Real-Time Word Tracking Loses Sync During Recitation

**What goes wrong:**
The word-by-word highlighting on screen falls out of sync with the user's actual recitation. The highlighted word lags behind where the user is reading, jumps ahead, or gets stuck on a word. This breaks the core interaction loop because the user cannot trust the visual feedback. It is especially disorienting during fast recitation (hadr) or when the user pauses to think.

**Why it happens:**
- Whisper processes audio in 30-second chunks, not word-by-word streaming. There is inherent latency in recognizing and aligning each word
- The ASR output is a sequence of recognized tokens that must be mapped back to specific positions in the Quran text. If the mapping algorithm is naive (sequential match), any missed or extra word throws off all subsequent alignment
- Network latency is not a factor (on-device), but processing latency is: WhisperKit achieves 0.45s per-word latency on Apple Silicon, which is noticeable when reciting at normal speed (2-3 words per second)
- Pauses between ayahs, restarts, or corrections by the user create ambiguity in the audio stream
- The user may skip an ayah, repeat a word, or go back -- the tracker must handle non-linear navigation

**How to avoid:**
- Use a streaming ASR approach rather than batch processing. Bloomberg's two-pass decoding (fast CTC decoder for partial results + Whisper cleanup) achieves sub-second latency
- Implement a "follow-along" algorithm that uses the known Quran text as a constrained language model -- the ASR only needs to match against the expected next N words, not the entire Arabic vocabulary
- Add tolerance for user behaviors: repetition, self-correction, pausing, skipping. The tracker should not advance on silence and should handle repetition gracefully
- Display highlighting with a slight deliberate delay (200-300ms) rather than trying to be perfectly real-time -- consistent slight lag feels better than jittery sync
- Provide a manual "I am here" tap on any word to re-anchor the tracker if it drifts

**Warning signs:**
- Highlighting jumps 2+ words at once
- Highlighting gets stuck on a word during continuous recitation
- Highlighting position diverges by more than 1 word from actual recitation
- Users tap the screen to try to "fix" the highlighting position

**Phase to address:**
Core interaction loop phase. Word tracking is the primary UX, not a secondary feature. Build and test this before mistake detection -- it must work reliably as a follow-along reader even if mistake detection is not ready.

---

### Pitfall 7: Ignoring the Spiritual UX in Favor of Gamification

**What goes wrong:**
The app treats Quran memorization like a productivity app or game. Aggressive streaks, achievement badges, progress percentages, and competitive metrics create anxiety rather than peace. Users memorizing the Quran are engaged in a deeply spiritual practice. An app that makes them feel guilty for missing a day, or that reduces their relationship with the Quran to a progress bar, will alienate the most committed users. The project explicitly states "leaderboard / social competition -- not aligned with the spiritual nature of memorization," but this pitfall extends beyond leaderboards.

**Why it happens:**
- Developers default to standard mobile engagement patterns (streaks, notifications, badges) without considering the domain
- Product metrics (DAU, retention) push toward addictive design patterns that conflict with spiritual practice
- Non-Muslim developers or developers unfamiliar with the Hifz tradition may not understand the reverence expected
- "Daily practice streaks" (listed in requirements) can become a source of anxiety rather than encouragement if implemented poorly

**How to avoid:**
- Frame streaks as encouragement, not punishment. Show "You have recited for 15 days" rather than "Your streak will be lost!"
- Use gentle, warm language. "Continue your journey" not "Complete your daily goal"
- Design the recitation screen to be calm and distraction-free: minimal UI chrome, muted colors, no pop-ups during recitation
- Progress tracking should emphasize the journey and barakah, not just metrics. Show "You have reviewed Surah Al-Baqarah 12 times" rather than "67% complete"
- Consult with Islamic scholars or experienced Hifz teachers on the UX language and flow
- Notifications should be opt-in and framed as gentle reminders, not guilt-inducing prompts
- Never use the word "fail" or negative language when the user makes a mistake during recitation

**Warning signs:**
- UX copy uses productivity/gamification language ("level up," "unlock," "challenge")
- Users describe the app as "stressful" or "anxiety-inducing" in feedback
- The app interrupts recitation flow with pop-ups, animations, or celebrations
- Streak notifications feel pushy

**Phase to address:**
UX design phase. Establish design principles and a tone-of-voice guide before writing any interface copy. Review all user-facing text with someone experienced in Islamic education.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using platform speech recognition (Apple/Google) instead of custom model | Fast prototype, no model management | No control over Arabic Quran accuracy; no offline guarantee on all devices; API changes break the app | Never for production -- fine for a 1-week prototype to test UX flow |
| Storing all audio in app bundle | Simple distribution, guaranteed availability | 4-8GB app size per reciter; App Store rejection; users cannot install | Never -- must be progressive download from day one |
| Hardcoding a single Mushaf layout/font | Faster UI development | Alienates users who learned from IndoPak, Warsh, or other scripts; limits market to one tradition | Acceptable for v1 MVP if clearly scoped to Hafs/Uthmani only |
| Skipping audio segmentation validation | Ship faster | Correction clips sound wrong (clipped words, adjacent word bleeding); destroys trust in corrections | Never -- each correction clip must be audibly verified |
| Using cloud ASR with offline fallback | Lower initial complexity | Two code paths to maintain; inconsistent behavior online vs offline; privacy compromise | Only if on-device proves infeasible on target devices |
| Not implementing download resumption | Faster audio download feature | Users on slow connections lose progress; repeated re-downloads waste bandwidth and frustrate users | Never -- audio downloads are large enough to require resumption |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Quran text data (Tanzil/quran.com) | Using plain text without Uthmani encoding, losing critical diacritical marks | Use Tanzil's Uthmani Quran text with full tashkeel; verify encoding is UTF-8 with proper Unicode normalization (NFC) |
| Word-level audio timestamps (quran-align) | Assuming timestamps are perfect and playing clips at exact boundaries | Add 20-50ms padding on each side of word boundaries; crossfade between clips to avoid audio artifacts; validate each surah's timestamps |
| ExecuTorch / on-device Whisper | Loading the model at app startup, blocking the UI | Lazy-load the model when user enters recitation mode; show loading indicator; keep model in memory during session but unload on exit |
| Firebase/Supabase auth | Not handling the "recitation interrupted by auth token refresh" case | Use long-lived sessions; refresh tokens silently; never interrupt an active recitation session for any background operation |
| Push notifications | Sending notifications during prayer times or late night | Respect Islamic prayer times in notification scheduling; allow users to set "quiet hours"; never send during salah times |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full surah audio metadata at once | UI freezes when selecting long suwar (Al-Baqarah: 286 ayahs, 6,236 words) | Paginate/lazy-load audio metadata by ayah range; only load what is visible plus a small buffer | Suwar with 100+ ayahs |
| Running ASR inference on the main thread | UI freezes during recitation; dropped frames in word highlighting | Run inference in a dedicated background thread/worker; communicate results via message passing | Any device; immediately apparent |
| Rendering the entire Quran page as a single Text component | Slow rendering, high memory usage, layout jank during scrolling | Virtualized list of ayahs; render only visible ayahs plus small buffer | Pages with many ayahs or complex text |
| Not caching ASR model between sessions | 3-5 second cold start delay each time user begins recitation | Keep model loaded in memory during app foreground lifecycle; persist compiled model cache on disk | Every session start |
| Unbounded recitation history storage | App storage grows indefinitely; slow queries for progress dashboard | Cap history granularity (store session summaries, not word-by-word logs); implement data retention policy | After 6+ months of daily use |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Recording and transmitting audio without explicit consent | App Store rejection; privacy law violations (GDPR, local laws); user backlash -- Quran recitation is deeply personal | Process all audio on-device only; never transmit raw audio; make privacy a headline feature ("Your recitation never leaves your device") |
| Storing recitation recordings on device without encryption | If device is lost/stolen, someone else could hear the user's Quran recitation (culturally sensitive) | If storing recordings for review, encrypt at rest; offer auto-delete option; make recording storage opt-in |
| Weak authentication allowing access to another user's memorization progress | Privacy breach -- memorization progress is personal spiritual data | Standard auth best practices; treat Hifz progress as sensitive personal data |
| Not declaring microphone usage purpose clearly in app manifest | App Store and Play Store rejection | Write a clear, honest microphone usage description: "Tasmi' uses the microphone to listen to your Quran recitation and provide corrections. Audio is processed on your device and never sent to any server." |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Interrupting recitation flow with UI popups (achievements, tips, prompts) | Breaks spiritual concentration (khushoo'); user loses their place | Queue all non-critical notifications for after the session ends; recitation screen should be interruption-free |
| Showing error count prominently during recitation | Creates anxiety; user focuses on avoiding mistakes rather than connecting with the text | Show minimal feedback during recitation (subtle highlight color change); save detailed error report for post-session review |
| Requiring account creation before first recitation | Adds friction; user came to recite, not fill forms | Allow guest usage for first session; prompt for account creation after they experience value |
| Playing correction audio too loudly or abruptly | Startling; disrupts the calm of recitation | Gentle fade-in for correction audio; volume matched to ambient level; brief vibration first as a warning |
| Not supporting landscape orientation on tablets | Tablet users (common in Islamic study circles) cannot use the app effectively | Support landscape mode; two-page mushaf view on tablets |
| Auto-advancing to next ayah without user confirmation | User may want to repeat an ayah for practice; auto-advance disrupts their flow | Let the user control advancement; provide a "repeat ayah" mode and a "continuous" mode as options |

## "Looks Done But Isn't" Checklist

- [ ] **Speech Recognition:** Works in quiet testing environment -- verify it works with background noise (fan, AC, outdoor), echo (mosque/room reverb), and varying microphone distances
- [ ] **Arabic Text:** Renders correctly in simulator/emulator -- verify on 5+ real physical devices including budget Android devices and older iOS devices with custom Uthmani fonts and full diacritization
- [ ] **Word Highlighting:** Syncs in short test passages -- verify across full-length suwar, at different recitation speeds, and after user pauses/restarts/repeats
- [ ] **Audio Corrections:** Individual clips sound correct in isolation -- verify transitions between consecutive word corrections sound natural (no clicks, pops, or unnatural gaps)
- [ ] **Offline Mode:** Works on device with airplane mode on -- verify after app restart in airplane mode (model still cached? audio still available? progress still saved?)
- [ ] **Progress Tracking:** Tracks a single session correctly -- verify accumulated progress across weeks of daily use (data migration, storage growth, query performance)
- [ ] **Download Manager:** Downloads complete successfully on fast WiFi -- verify on slow 3G connection, after interruption, after device restart mid-download, and with low storage
- [ ] **RTL Layout:** Arabic text is right-to-left -- verify all UI elements respect RTL (navigation, swipe gestures, progress bars fill right-to-left, back buttons on correct side)
- [ ] **Microphone Permission:** Granted once and works -- verify behavior when permission is revoked mid-session, when another app takes the microphone, and on first launch

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| False positive corrections erode trust | MEDIUM | Add sensitivity settings post-launch; communicate improvements transparently; "we heard you" messaging to users |
| Arabic text rendering broken on device class | HIGH | Ship pre-rendered page images as emergency fallback; file upstream framework bugs; test on affected devices before fix |
| Audio assets too large / downloads fail | HIGH | Redesign download architecture (chunked by surah); implement differential downloads; migrate existing users to new system |
| ASR crashes on low-end devices | HIGH | Add cloud fallback option; reduce model size further; set minimum device requirements; offer "lite mode" |
| Word tracking loses sync | MEDIUM | Add manual re-anchor (tap word to reset position); reduce tracking sensitivity; implement tracking confidence display |
| Gamification alienates users | LOW | Redesign UX copy and tone; make streaks optional; reframe around spiritual language; user settings for notification style |
| Incorrect mushaf text data | CRITICAL | Immediate hotfix required; any error in Quran text is unacceptable; implement text verification against multiple authoritative sources before any release |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| False positive corrections | Speech recognition core (Phase 1-2) | Blind test with 20+ diverse reciters; false positive rate < 2% on correct recitation |
| Arabic text rendering | UI foundation (Phase 1) | Visual regression tests passing on 8+ physical devices; mushaf scholar review |
| Audio asset management | Audio infrastructure (Phase 1-2) | Successfully download, pause, resume, and play corrections for a full juz on slow connection |
| Model size / device crashes | Device compatibility (Phase 1-2) | App runs stable 30-minute recitation session on device with 3GB RAM without crash |
| Recitation style diversity | ASR training/tuning (Phase 2-3) | Accuracy metrics within 5% across 4+ accent groups and 3 recitation speeds |
| Word tracking sync | Core interaction loop (Phase 2) | Tracking stays within 1 word of actual position for 95% of recitation duration |
| Spiritual UX tone | UX design (Phase 1) | Design review by Islamic educator; no gamification/productivity language in recitation flow |

## Sources

- [Tarteel App Reviews 2026 - JustUseApp](https://justuseapp.com/en/app/1391009396/tarteel-recite-al-quran/reviews)
- [Arabic ASR Challenges and Progress - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0167639324000815)
- [Speech Recognition Models for Quran Recitation - IJACSA](https://thesai.org/Downloads/Volume14No12/Paper_97-Speech_Recognition_Models_for_Holy_Quran_Recitation.pdf)
- [Mispronunciation Detection of Quranic Recitation Rules - arXiv](https://arxiv.org/abs/2305.06429)
- [quran-align: Word-accurate timestamps - GitHub](https://github.com/cpfair/quran-align)
- [tarteel-ai/whisper-base-ar-quran - Hugging Face](https://huggingface.co/tarteel-ai/whisper-base-ar-quran)
- [React Native ExecuTorch - useSpeechToText docs](https://docs.swmansion.com/react-native-executorch/docs/0.4.x/natural-language-processing/useSpeechToText)
- [Quran Foundation Font Rendering Guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- [Flutter Arabic Diacritics Issue #16886](https://github.com/flutter/flutter/issues/16886)
- [Flutter Arabic Text Rendering Issue #143975](https://github.com/flutter/flutter/issues/143975)
- [Flutter Impeller Arabic Rendering Issue #119805](https://github.com/flutter/flutter/issues/119805)
- [Quran Word-by-Word Audio Dataset - Internet Archive](https://archive.org/details/quran-wordbyword)
- [WhisperKit: On-device ASR - GitHub](https://github.com/argmaxinc/WhisperKit)
- [Bloomberg Streaming Whisper - Interspeech 2025](https://www.bloomberg.com/company/stories/bloombergs-ai-researchers-turn-whisper-into-a-true-streaming-asr-model-at-interspeech-2025/)
- [Evaluating ASR Confidence Scores for Error Detection - arXiv](https://arxiv.org/html/2503.15124v1)
- [Expo Blog: How to Run AI Models with React Native ExecuTorch](https://expo.dev/blog/how-to-run-ai-models-with-react-native-executorch)
- [Tarteel vs Quranly Comparison](https://www.quranly.app/blog/tarteel-vs-quranly-comparison)
- [Quranic Universal Library - Tarteel](https://qul.tarteel.ai/)

---
*Pitfalls research for: Quran memorization mobile app with on-device Arabic speech recognition*
*Researched: 2026-03-18*

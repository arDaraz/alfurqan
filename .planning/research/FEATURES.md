# Feature Research

**Domain:** Quran Memorization (Hifz) Mobile App
**Researched:** 2026-03-18
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any serious Quran memorization app. Missing these means users leave for Tarteel, Mathani, or Tasmee.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Quran text display (Uthmani script)** | Every Quran app has this. Non-negotiable. Users expect Madani Mushaf-quality rendering. | MEDIUM | Requires proper Arabic RTL rendering, Uthmani font (e.g., KFGQPC Uthmani Hafs), page/surah/juz navigation. Multiple script options (Madani, Indo-Pak) are nice but Uthmani is minimum. |
| **Surah/Ayah selection for recitation** | Standard flow in Tarteel, Tasmee, and every memorization app. Users pick what to recite. | LOW | Surah picker + ayah range selector. Must support juz-based selection too. |
| **Audio recitation playback** | Every Quran app offers this. Users listen to Qaris to learn correct pronunciation before reciting. | MEDIUM | Need licensed audio from well-known Qaris (Husary, Minshawi, etc.). Word-level segmentation needed for correction feature. Offline download support expected. |
| **Speech recognition for recitation** | Tarteel and Tasmee have normalized this. Users expect the app to listen and detect mistakes. | HIGH | Core technical challenge. Tarteel uses cloud-based recognition. Tasmi' differentiates with on-device. Word-level accuracy is the baseline (letter-level tajweed detection not yet solved industry-wide). |
| **Mistake detection and feedback** | Tarteel, Tasmee, and HifzPath all provide this. Users expect to know when they make errors. | HIGH | Must flag: wrong words, skipped words, incorrect word order. Visual indication of error location is minimum. |
| **Progress tracking** | Every competitor tracks surah completion, session history, and overall memorization progress. | MEDIUM | Dashboard showing memorized vs. in-progress vs. not-started per surah/juz. Session history with accuracy scores. |
| **Bookmarking / resume** | Users expect to pick up where they left off. Standard in all Quran apps. | LOW | Save last position, recently practiced surahs, quick-resume. |
| **Multiple Qari audio options** | Users have preferences for reciters. Tarteel, Quran.com, and most apps offer 10+ reciters. | LOW | At minimum 3-5 well-known reciters. More is better but not blocking for launch. Audio licensing is the constraint, not technical. |
| **Offline functionality** | Users recite in mosques, during travel, and in areas with poor connectivity. HifzPath explicitly markets this. | HIGH | Quran text + selected audio must work offline. For Tasmi', on-device speech recognition makes offline the default -- this is both a table stake and differentiator. |
| **Beautiful, reverent UI** | The Quran is sacred text. A cheap-looking UI signals disrespect. Users compare against polished apps like Tarteel and Quran.com. | MEDIUM | Calm color palette, elegant Arabic typography, appropriate spacing and layout. No cluttered interfaces. Dark mode expected. |
| **User accounts and cloud sync** | Users switch phones. Tarteel and Mathani sync progress across devices. | MEDIUM | Authentication (email, Apple, Google sign-in). Progress data sync. Can be deferred to post-initial-launch if offline-first is prioritized. |

### Differentiators (Competitive Advantage)

Features that set Tasmi' apart. These are where Tasmi' competes and wins.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **On-device speech recognition (fully offline)** | Tarteel requires internet for AI features. Tasmee requires internet. HifzPath uses browser APIs (limited). Tasmi' working fully offline is a genuine differentiator -- privacy, zero latency, works anywhere. No competitor does this well on native mobile. | VERY HIGH | This is the core technical bet. Requires on-device Arabic ASR model (Whisper variants, or custom). Tarteel has published whisper-base-ar-quran on HuggingFace -- potential starting point. Must fit on mobile (model size vs. accuracy tradeoff). |
| **Instant haptic feedback on mistakes** | No competitor uses haptic feedback. All competitors use visual-only or audio-only error signals. Haptic creates a visceral, immediate correction loop without breaking the recitation flow. | LOW | iOS Taptic Engine and Android vibration APIs are well-documented. The technical challenge is in the detection speed, not the haptic itself. |
| **Sheikh audio correction at word level** | When a mistake is detected, the correct word is spoken aloud by a real Sheikh recording -- not TTS, not just a visual highlight. This mimics the real musahih (teacher) experience far better than competitors who just highlight errors. | HIGH | Requires word-level audio segmentation of full Quran recordings. ~77,000+ words. Audio must be pre-processed and indexed. Storage footprint is significant (likely 500MB-1GB for full Quran word-level audio). |
| **Real-time word-by-word highlighting during recitation** | Tarteel does this but cloud-dependent. Quran Live does it for audio playback only (not user recitation). Doing this on-device during live recitation with zero lag is genuinely impressive and builds user trust. | HIGH | Tight coupling between speech recognition output and UI state. Must handle varying recitation speeds, pauses, and repetitions gracefully. |
| **Musahih experience (digital teacher paradigm)** | Competitors are either "test yourself" (Mathani quizzes) or "detect mistakes" (Tarteel). Tasmi' positions as a teacher who listens, corrects in real-time with audio, and guides -- a fundamentally different UX paradigm. | MEDIUM | This is a UX/design differentiator more than a technical one. The combination of listen + highlight + haptic + Sheikh audio correction creates the "teacher" feel. |
| **Zero-latency correction loop** | Cloud-based competitors have inherent latency (network round-trip). On-device recognition enables sub-100ms mistake detection to haptic/audio response. This speed makes corrections feel natural, like a real teacher. | HIGH | Depends on on-device model inference speed. Must be real-time streaming, not batch processing. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but should be deliberately avoided for Tasmi'.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Leaderboards / social competition** | Gamification increases engagement in other apps (Quran Companion had this). | Quran memorization is a deeply personal, spiritual act. Competition cheapens it and creates anxiety. Quran Companion (which had leaderboards) is now abandoned. PROJECT.md explicitly marks this out of scope. | Private milestone celebrations, personal streaks, and self-improvement metrics. |
| **Tajweed rule detection (letter-level)** | Users want to know if their makhaarij (pronunciation points) are correct. | Current AI cannot reliably detect letter-level Arabic pronunciation differences (research shows 60-70% accuracy for tajweed rules). Shipping this with poor accuracy would erode trust. Tarteel explicitly acknowledges word-level only. | Position as memorization (hifz) partner, not tajweed teacher. Recommend human teachers for tajweed. Can add tajweed color-coding to displayed text as a passive reference. |
| **Auto-detect mode (identify which surah user is reciting)** | Some users want to just start reciting and have the app figure out where they are. RecitID does this for audio identification. | Much harder technically (searching all 6,236 ayahs vs. matching against a known target). Higher error rate. Users practicing hifz already know what they are reciting. PROJECT.md marks out of scope. | Select-first flow (pick surah/ayah, then recite). Simple, reliable, matches how hifz is actually practiced with a human teacher. |
| **TTS (text-to-speech) corrections** | Cheaper to implement than real Sheikh recordings. | Synthetic Arabic Quran recitation sounds robotic and disrespectful. Users will not trust TTS corrections for sacred text. Authenticity matters enormously in this domain. PROJECT.md explicitly forbids this. | Real Sheikh recordings only. More expensive to produce but non-negotiable for user trust and spiritual experience. |
| **Social sharing of progress** | Users might want to share achievements on social media. | Risk of riyaa (showing off in worship). Cultural/religious sensitivity issue. Most serious hifz students would find this off-putting. | Keep progress private by default. Optional sharing with an accountability partner (one-to-one) could work in future. |
| **Extensive tafsir/translation integration** | Users want to understand what they memorize. | Scope creep -- Quran.com and dedicated tafsir apps do this excellently. Building a mediocre version wastes effort. | Link out to Quran.com or other tafsir apps. Focus on memorization, not comprehension (different use cases). |
| **Live teacher marketplace** | Quran Mobasher and Quran University connect users with live teachers. | Completely different business model (marketplace logistics, teacher vetting, scheduling). Massive scope expansion. | Position as complement to human teachers, not replacement. "Practice with Tasmi' between sessions with your teacher." |
| **Kids-specific mode** | Thurayya targets kids. Parents want this. | Different UI patterns, different voice models (children's voices have different acoustic properties), content moderation, parental controls. Essentially a different product. | Build the core product for adults/teens first. Kids mode is a v2+ consideration only after core is validated. |
| **Web version** | Some users prefer desktop. | Splits engineering effort. On-device speech recognition is harder on web (browser API limitations). PROJECT.md marks out of scope. | Mobile-only (iOS + Android via cross-platform framework). |

## Feature Dependencies

```
[On-Device Speech Recognition Model]
    |
    |--requires--> [Audio Input Pipeline (microphone access, streaming)]
    |--requires--> [Quran Text Corpus (tokenized, indexed for matching)]
    |--enables---> [Word-by-Word Matching Engine]
                       |
                       |--enables--> [Real-Time Word Highlighting]
                       |--enables--> [Mistake Detection]
                                        |
                                        |--enables--> [Haptic Feedback on Error]
                                        |--enables--> [Sheikh Audio Correction Playback]
                                        |--enables--> [Accuracy Scoring per Session]
                                                          |
                                                          |--enables--> [Progress Dashboard]
                                                          |--enables--> [Daily Streaks]
                                                          |--enables--> [Milestone Celebrations]

[Quran Text Display (Uthmani)]
    |--independent (can build in parallel)

[Audio Recitation Playback (Qari)]
    |--independent (can build in parallel)
    |--shares asset pipeline with--> [Sheikh Audio Correction Playback]

[User Accounts + Auth]
    |--enables--> [Cloud Sync of Progress]
    |--enables--> [Cross-Device Resume]

[Surah/Ayah Selection UI]
    |--required before--> [Recitation Session Flow]
```

### Dependency Notes

- **Speech Recognition is the critical path.** Everything that makes Tasmi' special (highlighting, haptic, Sheikh correction) depends on accurate, real-time, on-device speech recognition. This must be validated first.
- **Quran text display and audio playback are independent.** These can be built in parallel with speech recognition work. They are table stakes but have no dependency on the AI pipeline.
- **Sheikh audio correction requires word-level audio segmentation.** This is a separate, significant data preparation task. Must be done before the correction playback feature works. Can start asset preparation early while speech recognition is being built.
- **Progress tracking depends on session completion.** Accuracy scores feed into progress dashboards. Progress features are meaningless without a working recitation session.
- **User accounts are not blocking for core functionality.** Offline-first architecture means the app works without accounts. Auth + sync can layer on top after core recitation loop is validated.

## MVP Definition

### Launch With (v1)

Minimum viable product -- validate that on-device Quran speech recognition works and the correction loop feels like a real musahih.

- [ ] **Quran text display** (Uthmani script, surah/ayah navigation) -- users need to see what they are reciting
- [ ] **Surah and ayah range selection** -- users pick what to practice
- [ ] **On-device speech recognition** (Arabic Quranic recitation) -- the core technical differentiator; even if only a subset of surahs works initially
- [ ] **Word-by-word matching and highlighting** -- visual confirmation the app is following along
- [ ] **Mistake detection with haptic feedback** -- instant vibration on error, the "teacher tap"
- [ ] **Sheikh audio correction on mistake** -- play the correct word from a real recording; start with 1-2 Qaris
- [ ] **Basic session history** -- what was practiced, when, rough accuracy
- [ ] **Offline-first operation** -- everything above works without internet

### Add After Validation (v1.x)

Features to add once core recitation loop is working and users confirm the experience feels right.

- [ ] **User accounts and cloud sync** -- trigger: users asking to transfer progress to new device
- [ ] **Multiple Qari options** (5+) -- trigger: users requesting specific reciters
- [ ] **Progress dashboard** (memorization heatmap, surah-level tracking) -- trigger: users using app regularly and wanting to see journey
- [ ] **Daily streaks and practice reminders** -- trigger: retention data shows users dropping off
- [ ] **Accuracy scoring refinement** (per-surah, per-session trends) -- trigger: users wanting detailed performance data
- [ ] **Milestone celebrations** (juz completion, surah completion) -- trigger: users reaching completion milestones
- [ ] **Dark mode** -- trigger: user requests (likely immediate)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Spaced repetition for muraja'ah (review scheduling)** -- why defer: requires significant usage data to tune intervals; Mathani and Al Muraja'ah focus here, but the core recitation loop is Tasmi's differentiator, not review scheduling
- [ ] **Adaptive difficulty** (progressively hiding more text) -- why defer: UX complexity, needs user research on how people want to test themselves
- [ ] **Tajweed color-coding on displayed text** -- why defer: useful reference but not core to memorization; display-only, no detection
- [ ] **Family/group plans** -- why defer: monetization feature, premature before product-market fit
- [ ] **Kids mode** -- why defer: fundamentally different voice models and UX patterns
- [ ] **Partial ayah recitation support** -- why defer: users typically recite full ayahs or sequences; partial matching is technically harder
- [ ] **Recording and playback of user recitation** -- why defer: nice for self-review but not core to the correction loop

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| On-device speech recognition | HIGH | VERY HIGH | P1 |
| Word-by-word matching + highlighting | HIGH | HIGH | P1 |
| Mistake detection + haptic feedback | HIGH | MEDIUM | P1 |
| Sheikh audio correction playback | HIGH | HIGH | P1 |
| Quran text display (Uthmani) | HIGH | MEDIUM | P1 |
| Surah/ayah selection | HIGH | LOW | P1 |
| Offline operation | HIGH | MEDIUM | P1 |
| Basic session history | MEDIUM | LOW | P1 |
| User accounts + cloud sync | MEDIUM | MEDIUM | P2 |
| Progress dashboard | MEDIUM | MEDIUM | P2 |
| Multiple Qari options (5+) | MEDIUM | LOW | P2 |
| Daily streaks + reminders | MEDIUM | LOW | P2 |
| Accuracy scoring trends | MEDIUM | LOW | P2 |
| Milestone celebrations | LOW | LOW | P2 |
| Dark mode | MEDIUM | LOW | P2 |
| Spaced repetition (muraja'ah) | HIGH | HIGH | P3 |
| Tajweed color-coding (display) | LOW | MEDIUM | P3 |
| Recording + playback | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch -- validates the core "digital musahih" experience
- P2: Should have, add post-validation -- builds retention and engagement
- P3: Nice to have, future consideration -- expands the product surface

## Competitor Feature Analysis

| Feature | Tarteel | Tasmee (Eqra) | Mathani | HifzPath | Tasmi' (Our Approach) |
|---------|---------|---------------|---------|----------|----------------------|
| **Speech Recognition** | Cloud-based AI (requires internet) | Cloud-based (requires internet) | None (quiz-based) | Browser Web Speech API | On-device (offline, zero latency) |
| **Mistake Detection** | Word-level, visual highlight | Word-level, alerts | N/A (self-graded quizzes) | Word highlight (green = correct) | Word-level + haptic + Sheikh audio correction |
| **Correction Method** | Visual highlight showing wrong vs. correct | Alert notification | Shows correct answer | Green/no highlight | Real Sheikh audio plays correct word + haptic vibration |
| **Offline Support** | Audio download only; AI requires internet | Requires internet | Partial | PWA (works after load) | Fully offline -- recognition, text, audio, everything |
| **Progress Tracking** | Heatmaps, streaks, analytics (Premium) | Session history | Goals, streaks, XP, levels | Basic analytics | Session history, accuracy scores, memorization dashboard |
| **Spaced Repetition** | No | No | Yes (core feature) | No | Future (v2+) |
| **Word Highlighting** | Real-time (cloud-dependent) | No real-time highlighting mentioned | No | Green highlight on correct words | Real-time on-device (instant) |
| **Pricing** | Free tier + $9.99/mo Premium | Free | Subscription | Free | TBD -- likely freemium |
| **Platforms** | iOS, Android, Web | Android (primarily) | iOS, Android | Web (PWA) | iOS + Android (cross-platform) |
| **Haptic Feedback** | No | No | No | No | Yes -- core differentiator |
| **Sheikh Audio Corrections** | No (visual only) | Helps when "stuck" (audio assist) | Sheikh recitation for learning | No | Yes -- word-level Sheikh audio on every mistake |

### Key Competitive Gaps Tasmi' Fills

1. **No competitor offers fully offline AI-powered recitation checking on native mobile.** Tarteel and Tasmee both require internet. HifzPath uses limited browser APIs.
2. **No competitor combines haptic + audio + visual feedback.** All competitors rely on visual-only error indication.
3. **No competitor plays the specific correct word from a Sheikh recording on mistake.** Tasmee offers "help when stuck" but not proactive word-level correction audio.
4. **The "digital musahih" paradigm is unique.** Competitors are either "error detectors" (Tarteel) or "quiz tools" (Mathani). Tasmi' aims to recreate the actual teacher-student recitation experience.

## Sources

- [The Top 50+ Quran Memorization Apps](https://howtomemorisethequran.com/top-quran-memorization-apps/) -- comprehensive app listing with feature analysis
- [Tarteel AI](https://tarteel.ai) -- primary competitor, AI-powered recitation features
- [Tarteel Features Help Center](https://support.tarteel.ai/en/collections/15105266-tarteel-features) -- detailed feature documentation
- [Tarteel whisper-base-ar-quran model (HuggingFace)](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) -- open-source Quran ASR model
- [Tasmee on Google Play](https://play.google.com/store/apps/details?id=com.eqra.android.tasmee&hl=en_US) -- closest competitor by name and concept
- [Mathani App](https://www.mathani.app/) -- spaced repetition approach to Quran memorization
- [HifzPath](https://hifzpath.pages.dev/) -- browser-based speech recognition for Quran
- [Al Muraja'ah App](https://apps.apple.com/us/app/al-murajaah/id6742374091) -- spaced repetition for Quran review
- [TajweedMate](https://tajweedmate.com/) -- AI-powered tajweed checking (demonstrates letter-level detection limitations)
- [Best Quran Apps 2026 (RecitID)](https://recitid.ai/guides/best-quran-app-2026) -- market overview
- [Retain Quran](https://retainquranapp.com/) -- free nonprofit model with SRS
- [Quran.com](https://quran.com/) -- reference Quran app (free, open-source ecosystem)
- [Tarteel App Store Reviews](https://justuseapp.com/en/app/1391009396/tarteel-recite-al-quran/reviews) -- user complaints and limitations
- [Mispronunciation Detection of Basic Quranic Recitation Rules (arXiv)](https://arxiv.org/pdf/2305.06429) -- academic research on tajweed detection accuracy

---
*Feature research for: Quran Memorization (Hifz) Mobile App*
*Researched: 2026-03-18*

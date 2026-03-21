# Roadmap: Tasmi'

## Overview

Tasmi' delivers a digital Quran memorization partner that listens to live recitation and provides instant correction. The build follows a strict dependency chain: Quran text display and navigation must work first (Phase 1), then on-device Arabic speech recognition must be proven (Phase 2), then the core recitation loop connects recognition to word matching and feedback (Phase 3), then Sheikh audio corrections transform mistake detection into teaching (Phase 4), then progress tracking makes sessions meaningful over time (Phase 5), and finally user accounts and polish complete the production experience (Phase 6). Phases 1-2 de-risk the two hardest technical problems -- Arabic text rendering and on-device ASR -- before any dependent feature is built.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Quran Display** - Project scaffold, Quran data layer, text rendering with navigation
- [ ] **Phase 2: On-Device Speech Recognition** - Microphone capture and Arabic Quran ASR running locally on device
- [ ] **Phase 3: Core Recitation Loop** - Word matching, mistake detection, haptic feedback, real-time highlighting
- [ ] **Phase 4: Sheikh Audio Corrections** - Word-level correction audio playback, progressive download, multiple Qaris
- [ ] **Phase 5: Progress Tracking** - Session history, memorization dashboard, accuracy scores, streaks
- [ ] **Phase 6: Accounts and Polish** - User authentication, data persistence, dark mode, offline validation

## Phase Details

### Phase 1: Foundation and Quran Display
**Goal**: Users can browse and read the full Quran with proper Arabic rendering, navigate to any location, and select ayah ranges for practice
**Depends on**: Nothing (first phase)
**Requirements**: QTEXT-01, QTEXT-02, QTEXT-03, QTEXT-04, UI-01, UI-04
**Success Criteria** (what must be TRUE):
  1. User can view any surah with correctly rendered Uthmani Arabic script and full diacritics on both iOS and Android
  2. User can navigate to a specific surah, ayah, or juz using the app's navigation
  3. User can select a start and end ayah within a surah to define a recitation range
  4. User can bookmark their current position and return to it later
  5. First-time user sees a clear onboarding flow explaining how the app works
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffold, Quran data layer, types, theme, stores, hooks, test scaffold
- [ ] 01-02-PLAN.md — Home screen with surah/juz lists, search, tabs, and navigation
- [ ] 01-03-PLAN.md — Quran reader with Arabic text rendering, ornamental elements, ayah selection, auto-bookmark
- [ ] 01-04-PLAN.md — Onboarding flow and end-to-end verification

### Phase 2: On-Device Speech Recognition
**Goal**: The app can capture microphone audio and transcribe Arabic Quranic recitation entirely on-device without internet
**Depends on**: Phase 1
**Requirements**: ASR-01, ASR-02
**Success Criteria** (what must be TRUE):
  1. User can grant microphone permission and the app captures audio during a recitation session
  2. App transcribes Arabic Quranic recitation on-device with no network connection required
  3. Transcription output is accurate enough for word-level matching (validated against known ayahs on both iOS and Android)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Core Recitation Loop
**Goal**: Users experience the complete digital musahih -- recite from memory while the app follows along, highlights each word, and vibrates instantly on mistakes
**Depends on**: Phase 2
**Requirements**: ASR-03, ASR-04, ASR-05, ASR-07, QTEXT-05
**Success Criteria** (what must be TRUE):
  1. As the user recites, each word highlights in real-time on screen showing their current position in the text
  2. When the user says a wrong word, skips a word, or recites out of order, the app detects it and vibrates within 100ms
  3. User can pause recitation mid-session and resume from the same position without losing progress
  4. The recitation session produces an accuracy score based on mistakes detected
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Sheikh Audio Corrections
**Goal**: When a mistake is detected, the user hears the correct word spoken aloud by a Sheikh, with audio available offline after download
**Depends on**: Phase 3
**Requirements**: ASR-06, AUDIO-01, AUDIO-02, AUDIO-03
**Success Criteria** (what must be TRUE):
  1. When a mistake is detected during recitation, the correct word or ayah is spoken aloud automatically via pre-recorded Sheikh audio
  2. User can listen to full audio recitation of any surah or ayah outside of a recitation session
  3. User can choose from at least 2 different Qari voices for correction and playback audio
  4. Audio assets work fully offline after the user downloads them for a given surah
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Progress Tracking
**Goal**: Users can see their memorization journey -- what they practiced, how accurate they were, and how consistent they have been
**Depends on**: Phase 3
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04
**Success Criteria** (what must be TRUE):
  1. After completing a recitation session, the user can see it in their session history with date, surah/ayah practiced, duration, and accuracy score
  2. User can view a progress dashboard showing which surahs and juz are memorized, in progress, or not started
  3. App tracks and displays a daily practice streak showing consecutive days of practice
  4. User can view accuracy scores per session and per surah over time to see improvement trends
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Accounts and Polish
**Goal**: Users can create an account to persist their data, and the app reaches production quality with dark mode and verified offline operation
**Depends on**: Phase 5
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password, log in, and maintain an authenticated session
  2. User can log out from the app and log back in with their data intact
  3. All progress data (session history, streaks, accuracy scores) persists to the user's account
  4. App supports dark mode that can be toggled by the user
  5. All core features -- recitation, recognition, correction, and progress -- work fully without an internet connection
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Quran Display | 0/4 | Planning complete | - |
| 2. On-Device Speech Recognition | 0/0 | Not started | - |
| 3. Core Recitation Loop | 0/0 | Not started | - |
| 4. Sheikh Audio Corrections | 0/0 | Not started | - |
| 5. Progress Tracking | 0/0 | Not started | - |
| 6. Accounts and Polish | 0/0 | Not started | - |

# Requirements: Tasmi'

**Defined:** 2026-03-18
**Core Value:** A user can recite any portion of the Quran and receive immediate, accurate correction — like having a personal teacher available anytime, anywhere, without an internet connection.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Quran Text & Navigation

- [ ] **QTEXT-01**: User can view the full Quran in Uthmani script with proper Arabic diacritics rendering
- [ ] **QTEXT-02**: User can navigate by surah, ayah, and juz
- [ ] **QTEXT-03**: User can select a specific ayah range within a surah for recitation practice
- [ ] **QTEXT-04**: User can bookmark their position and resume from where they left off
- [ ] **QTEXT-05**: App highlights each word in real-time as the user recites, showing current position

### Speech Recognition & Correction

- [ ] **ASR-01**: App captures audio from device microphone during recitation session
- [ ] **ASR-02**: On-device speech recognition processes Arabic Quranic recitation without internet connection
- [ ] **ASR-03**: Word-by-word matching engine compares recognized speech against expected Quranic text
- [ ] **ASR-04**: App detects mistakes (wrong word, skipped word, incorrect word order) in real-time
- [ ] **ASR-05**: Instant haptic feedback (vibration) triggered within 100ms of mistake detection
- [ ] **ASR-06**: Correct word/ayah spoken aloud via pre-recorded Sheikh audio when mistake detected
- [ ] **ASR-07**: User can pause and resume recitation session at any point

### Audio Assets

- [ ] **AUDIO-01**: User can listen to full audio recitation of any surah/ayah from a Sheikh
- [ ] **AUDIO-02**: User can choose from 3-5 different Qari options for playback
- [ ] **AUDIO-03**: Audio assets available offline after initial download

### Progress & Gamification

- [ ] **PROG-01**: App records session history (date, surah/ayah practiced, duration, accuracy score)
- [ ] **PROG-02**: User can view a progress dashboard showing memorized vs in-progress vs not-started per surah/juz
- [ ] **PROG-03**: App tracks daily practice streaks with visual indicator
- [ ] **PROG-04**: User can view accuracy scores per session and per surah over time

### User Accounts

- [ ] **AUTH-01**: User can create an account with email and password
- [ ] **AUTH-02**: User can log in and maintain an authenticated session
- [ ] **AUTH-03**: User can log out from the app
- [ ] **AUTH-04**: User's progress data persists to their account

### UI/UX

- [ ] **UI-01**: App has a polished, reverent design appropriate for Quranic context (calm colors, elegant typography)
- [ ] **UI-02**: App supports dark mode
- [ ] **UI-03**: All core features (recitation, recognition, correction, progress) work fully offline
- [ ] **UI-04**: App provides clear onboarding for first-time users

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Accounts & Sync

- **SYNC-01**: User's progress syncs across multiple devices via cloud
- **SYNC-02**: User can sign in with Apple or Google account

### Gamification

- **GAM-01**: Milestone celebrations with visual/haptic effects when completing a juz or surah
- **GAM-02**: Practice reminders via push notifications

### Advanced Features

- **ADV-01**: Spaced repetition scheduling for muraja'ah (review) sessions
- **ADV-02**: Adaptive difficulty — progressively hide text as user demonstrates mastery
- **ADV-03**: Tajweed color-coding on displayed text (passive reference, no detection)
- **ADV-04**: Recording and playback of user's own recitation for self-review

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Leaderboard / social competition | Not aligned with the spiritual nature of Quran memorization; creates anxiety |
| Auto-detect mode | Much harder technically; select-first matches how hifz is actually practiced |
| TTS corrections | Synthetic Arabic Quran recitation sounds disrespectful; Sheikh recordings only |
| Web version | Mobile-first; on-device recognition is harder on web |
| Tajweed detection (letter-level) | Current AI only 60-70% accurate; would erode user trust |
| Social sharing of progress | Risk of riyaa (showing off worship); culturally sensitive |
| Tafsir/translation integration | Quran.com does this excellently; focus on memorization |
| Live teacher marketplace | Completely different business model and scope |
| Kids mode | Different voice models, UX patterns; essentially a different product |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (Populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 0
- Unmapped: 22 (pending roadmap)

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*

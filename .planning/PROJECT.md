# Tasmi'

## What This Is

Tasmi' is a cross-platform mobile app that acts as a digital Quran memorization partner (musahih). It listens to a user's live recitation, matches it word-by-word against the correct Quranic text using on-device speech recognition, and provides instant haptic feedback plus spoken corrections from a Sheikh's recording when a mistake is detected. The app shows the Quran text with real-time word-by-word highlighting as the user recites and tracks memorization progress over time.

## Core Value

A user can recite any portion of the Quran and receive immediate, accurate correction — like having a personal teacher available anytime, anywhere, without an internet connection.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User selects a surah and ayah range before starting a recitation session
- [ ] App listens to recitation and matches speech word-by-word against correct Quranic text
- [ ] On-device speech recognition for Arabic Quranic recitation (offline-capable)
- [ ] Haptic feedback triggered instantly when a mistake is detected
- [ ] Correct word/ayah spoken aloud via pre-recorded Sheikh audio on mistake
- [ ] Quran text displayed on screen with real-time word-by-word highlighting during recitation
- [ ] Multiple Qari options for correction audio (e.g., Husary, Minshawi)
- [ ] User accounts required — sign up to save and sync progress across devices
- [ ] Memorization progress dashboard — track which surahs/ayahs are memorized
- [ ] Daily practice streaks to build consistency
- [ ] Accuracy scores per session and per surah based on mistake count
- [ ] Milestone celebrations for completing juz or surah memorization
- [ ] Beautiful, polished UI appropriate for a spiritual/Quranic context

### Out of Scope

- Leaderboard / social competition — not aligned with the spiritual nature of memorization
- Auto-detect mode (identifying which part of Quran user is reciting) — select-first is sufficient for v1
- Text-to-speech corrections — using real Sheikh recordings only
- Web version — mobile-first, cross-platform via React Native or Flutter

## Context

- Tasmi' (تسميع) means "recitation from memory to a listener" in the Hifz tradition — the app digitizes this role
- The Hifz journey is deeply personal and spiritual; UI/UX must reflect reverence and calm
- On-device recognition is critical for: privacy (Quran recitation is personal), latency (instant feedback), and offline use (mosques, travel)
- Pre-recorded Sheikh audio for corrections gives users confidence in the accuracy of corrections
- Target audience spans all levels: beginners starting Hifz, intermediate memorizers adding new portions, and Huffaz doing muraja'ah (review)
- Cross-platform (iOS + Android) from day one to reach the widest audience

## Constraints

- **Speech Recognition**: Must work on-device for Arabic Quranic recitation — this is the core technical challenge
- **Audio Assets**: Need licensed/permissible word-level Sheikh recordings for corrections across the full Quran
- **Platform**: Cross-platform mobile (React Native or Flutter — to be decided during research)
- **Quality Bar**: Polished, production-grade UI — not an MVP/prototype aesthetic
- **Cultural Sensitivity**: UI, language, and interactions must be respectful of the Quran's sacred nature

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| On-device speech recognition | Privacy, latency, offline use | — Pending |
| Sheikh recordings for corrections (not TTS) | Authenticity and user trust | — Pending |
| Select-first flow (not auto-detect) | Simpler, reliable, matches how Hifz is practiced | — Pending |
| Accounts required | Progress sync across devices, user retention | — Pending |
| Cross-platform mobile | Reach both iOS and Android from v1 | — Pending |

---
*Last updated: 2026-03-18 after initialization*

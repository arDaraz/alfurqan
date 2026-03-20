# Phase 1: Foundation and Quran Display - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold with Expo SDK 55 + React Native, Quran data layer with word-level SQLite database, Uthmani Arabic text rendering with proper diacritics on both iOS and Android, surah/juz navigation, ayah range selection for recitation practice, auto-bookmark last position, and first-time onboarding. No speech recognition, no recitation sessions, no audio — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Quran text presentation
- Continuous vertical scroll layout — ayahs flow top-to-bottom in a scrollable view
- Arabic text only — no translations or transliterations (Quran.com handles that; this app is for memorization)
- Ornamental end-of-ayah markers (۝) with Arabic-Indic numerals inside — traditional mushaf feel
- Ornamental surah header banners between surahs — decorative frame showing surah name in Arabic, ayah count, and revelation type (Makki/Madani)
- Large, readable Arabic text (~24-28pt) — prioritize readability over density, ~3-4 ayahs visible at once
- Text alignment and spacing details are Claude's discretion

### Navigation & selection UX
- Home screen is a surah list — tap surah to open reader, search bar at top to filter by name/number
- Surah + Juz tabs — tabbed navigation to browse by surah list (114 surahs) or juz list (30 juz)
- Ayah range selection via tap-on-text — user taps first ayah (start), then taps last ayah (end), selected range highlights with a visible "Start Practice" button
- Single auto-saved last-read position — app remembers where user was reading, resumes automatically on reopen. No manual bookmark management.
- Wireframes should be planned during UI-phase

### Visual identity & theme
- Deep teal & gold color palette — primary #0D7377 (teal), accent #C9A84C (gold), background #FAF8F2 (warm cream), text #1A1A2E (near black), surface #FFFFFF
- Gold for ornamental elements (ayah markers, surah headers), teal for interactive elements (buttons, selected states)
- Subtle Islamic geometric/ornamental accents — used in surah header frames, screen borders, ayah markers, onboarding illustrations. NOT on buttons, nav elements, or cards
- Visual reference: Tarteel's clean modern Islamic aesthetic
- Large readable Arabic font using KFGQPC Uthmani Hafs

### Onboarding flow
- 3-screen swipeable walkthrough: (1) value prop — "Your digital memorization partner", (2) how it works — "Recite, we listen, instant feedback", (3) get started — lands on surah list
- Bilingual text (Arabic + English) — default language based on user locale
- Microphone permission deferred — NOT asked during onboarding. Asked contextually when user first taps "Start Practice" with a brief explanation of why

### Claude's Discretion
- Text alignment (centered vs right-aligned vs justified)
- Exact spacing between ayahs and around surah headers
- Loading skeleton design
- Surah list card design details
- Error state handling
- Exact onboarding illustration style
- Bottom tab bar vs no tab bar (navigation structure)
- Search UX details (debounce, result highlighting)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value, constraints, key decisions, cultural sensitivity requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirements; Phase 1 covers QTEXT-01 through QTEXT-04, UI-01, UI-04
- `.planning/ROADMAP.md` — Phase dependencies and success criteria

### Research
- `.planning/research/SUMMARY.md` — Recommended stack, architecture, critical pitfalls overview
- `.planning/research/STACK.md` — Full stack rationale (Expo SDK 55, NativeWind 4.1, WatermelonDB, Zustand+MMKV)
- `.planning/research/ARCHITECTURE.md` — Component architecture, data layer design, project structure
- `.planning/research/PITFALLS.md` — Arabic text rendering pitfalls (#2 critical pitfall), device testing requirements
- `.planning/research/FEATURES.md` — Feature prioritization and competitor analysis

### External data sources
- Quran Foundation API (https://api-docs.quran.foundation/) — Word-level Quran text data
- Tanzil.net — Alternative Quran text data source
- KFGQPC Uthmani Hafs font — Arabic rendering font

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — this is a greenfield project. Phase 1 creates the foundation.

### Established Patterns
- No patterns yet — Phase 1 establishes the patterns that all subsequent phases will follow (state management with Zustand+MMKV, styling with NativeWind 4.1, navigation with Expo Router v7, data layer with WatermelonDB).

### Integration Points
- No existing integrations — Phase 1 creates the app skeleton, navigation structure, and data layer that Phases 2-6 will build on.

</code_context>

<specifics>
## Specific Ideas

- Visual aesthetic should reference Tarteel's clean modern Islamic feel
- Surah headers should have an ornamental banner frame — like a traditional mushaf chapter divider
- Ayah end markers should use the traditional ۝ symbol with Arabic-Indic numerals
- Bilingual onboarding defaults to user's device locale (Arabic or English)
- User specifically requested wireframe planning via `/gsd:ui-phase 1`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-and-quran-display*
*Context gathered: 2026-03-20*

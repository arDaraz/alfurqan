---
phase: 01-foundation-and-quran-display
plan: 01
subsystem: foundation
tags: [expo-sdk-55, nativewind, tailwindcss, zustand, mmkv, expo-sqlite, expo-router, jest, arabic-font, quran-database]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - Expo SDK 55 project scaffold with all dependencies configured
  - Quran SQLite database with 114 surahs and 6236 ayahs (Uthmani text with full diacritics)
  - KFGQPC Uthmani Hafs Arabic font bundled as TTF asset
  - TypeScript types for all Quran data models
  - Theme constants matching UI-SPEC color palette
  - Zustand + MMKV persistent stores (reading, selection, settings)
  - Custom hooks for data fetching and state management
  - Expo Router navigation skeleton (tabs, surah reader, onboarding)
  - SQLite database module and typed repository layer
  - Jest test suite with 58 passing tests
affects: [01-02, 01-03, 01-04, phase-2, phase-3]

# Tech tracking
tech-stack:
  added: [expo@55.0.8, expo-router@55.0.7, nativewind@4.2.3, tailwindcss@3.4.19, zustand@5.0.12, react-native-mmkv@4.3.0, zustand-mmkv-storage@1.0.0, expo-sqlite@55.0.11, "@shopify/flash-list@2.0.2", expo-dev-client, expo-haptics@55.0.9, expo-font@55.0.4, better-sqlite3, jest@29, jest-expo@55.0.11]
  patterns: [zustand-mmkv-persist, expo-sqlite-bundled-asset, expo-router-file-routing, tdd-with-jest-expo]

key-files:
  created:
    - src/data/types.ts
    - src/data/database.ts
    - src/data/quranRepository.ts
    - src/data/seed/buildQuranDb.ts
    - src/constants/theme.ts
    - src/constants/quran.ts
    - src/utils/arabic.ts
    - src/utils/locale.ts
    - src/stores/readingStore.ts
    - src/stores/selectionStore.ts
    - src/stores/settingsStore.ts
    - src/hooks/useQuranText.ts
    - src/hooks/useSurahList.ts
    - src/hooks/useJuzList.ts
    - src/hooks/useSearch.ts
    - src/hooks/useLastRead.ts
    - src/app/_layout.tsx
    - src/app/(tabs)/_layout.tsx
    - src/app/(tabs)/index.tsx
    - src/app/(tabs)/settings.tsx
    - src/app/surah/[id].tsx
    - src/app/onboarding.tsx
    - assets/db/quran.db
    - assets/fonts/KFGQPCUthmanicScriptHAFS.ttf
  modified:
    - package.json
    - app.json
    - tsconfig.json
    - babel.config.js
    - metro.config.js

key-decisions:
  - "Used expo-sqlite instead of WatermelonDB for Quran text -- read-only static data does not need reactive/sync features"
  - "Used Jest 29 instead of Jest 30 -- Jest 30 sandbox mode incompatible with expo SDK 55 winter runtime"
  - "Used /verses/by_chapter API endpoint instead of /quran/verses/uthmani -- the latter lacks juz/hizb/page metadata"
  - "KFGQPC font sourced from thetruetruth/quran-data-kfgqpc GitHub repo (hafs.18.ttf)"
  - "Adapted to Expo SDK 55 default structure with src/app/ for Expo Router (not root app/)"

patterns-established:
  - "Zustand + MMKV persistence: create store with persist middleware backed by createMMKVStorage"
  - "Data hooks: async useEffect with cleanup flag for SQLite queries"
  - "Search: local in-memory filter with debounce timer on Surah array"
  - "Repository pattern: typed row interfaces mapped to domain types"
  - "Test mocking: mock database module with jest.mock, mock MMKV with in-memory stubs"

requirements-completed: [QTEXT-01, QTEXT-02, QTEXT-04, UI-01]

# Metrics
duration: 23min
completed: 2026-03-22
---

# Phase 01 Plan 01: Foundation and Quran Display Summary

**Expo SDK 55 project with bundled Quran SQLite database (114 surahs, 6236 Uthmani ayahs), KFGQPC Arabic font, Zustand+MMKV stores, Expo Router navigation skeleton, and 58-test Jest suite**

## Performance

- **Duration:** 23 min
- **Started:** 2026-03-22T11:41:27Z
- **Completed:** 2026-03-22T12:04:33Z
- **Tasks:** 2
- **Files modified:** 67

## Accomplishments
- Complete Expo SDK 55 project scaffold with NativeWind 4.x, Tailwind CSS 3.x, and all dependencies
- Quran SQLite database built from Quran Foundation API v4 with full Uthmani text (114 surahs, 6236 ayahs, 30 juz entries), all integrity checks passing
- KFGQPC Uthmani Hafs TTF font bundled for Arabic text rendering
- TypeScript types, theme constants, Zustand+MMKV stores, custom hooks, and Expo Router navigation skeleton all in place
- Jest test suite with 58 passing tests covering theme tokens, Arabic utils, store behavior, search logic, and repository queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Expo project scaffold, dependencies, configuration, types, theme, stores, hooks, and utilities** - `d85b34d` (feat)
2. **Task 2: Quran SQLite database build script and bundled database** - `b8fd2db` (feat)

## Files Created/Modified
- `package.json` - Expo SDK 55 with all dependencies
- `app.json` - Expo app configuration
- `tsconfig.json` - TypeScript config with path aliases
- `babel.config.js` - Babel with NativeWind preset
- `metro.config.js` - Metro with NativeWind integration
- `tailwind.config.js` - Tailwind CSS 3.x with custom teal/gold/cream colors
- `global.css` - Tailwind CSS directives
- `nativewind-env.d.ts` - NativeWind type declarations
- `jest.config.js` - Jest with jest-expo preset
- `jest.setup.js` - Jest setup for Expo winter runtime
- `src/data/types.ts` - Surah, Ayah, Juz, AyahRange, LastReadPosition interfaces
- `src/data/database.ts` - SQLite connection with bundled asset
- `src/data/quranRepository.ts` - Typed data access layer (getSurahs, getAyahsBySurah, getJuzList, searchSurahs)
- `src/data/seed/buildQuranDb.ts` - Build-time script to fetch Quran data from API and populate SQLite
- `src/constants/theme.ts` - Design system tokens matching UI-SPEC
- `src/constants/quran.ts` - Static metadata for all 114 surahs
- `src/utils/arabic.ts` - toArabicIndic and normalizeArabic utilities
- `src/utils/locale.ts` - Device language detection
- `src/stores/readingStore.ts` - Last-read position and onboarding flag with MMKV persistence
- `src/stores/selectionStore.ts` - Ephemeral ayah range selection state
- `src/stores/settingsStore.ts` - Language settings with MMKV persistence
- `src/hooks/useQuranText.ts` - Hook for fetching ayahs by surah
- `src/hooks/useSurahList.ts` - Hook for fetching all surahs
- `src/hooks/useJuzList.ts` - Hook for fetching juz list
- `src/hooks/useSearch.ts` - Hook for debounced surah search
- `src/hooks/useLastRead.ts` - Hook for last-read position
- `src/app/_layout.tsx` - Root layout with font loading, onboarding redirect, Stack navigator
- `src/app/(tabs)/_layout.tsx` - Tab layout with Home and Settings tabs
- `src/app/(tabs)/index.tsx` - Home screen placeholder
- `src/app/(tabs)/settings.tsx` - Settings screen placeholder
- `src/app/surah/[id].tsx` - Surah reader placeholder
- `src/app/onboarding.tsx` - Onboarding placeholder
- `assets/db/quran.db` - Pre-populated SQLite database (1.71 MB)
- `assets/fonts/KFGQPCUthmanicScriptHAFS.ttf` - KFGQPC Uthmani Hafs font (242 KB)
- `tests/constants/theme.test.ts` - Theme token verification tests
- `tests/utils/arabic.test.ts` - Arabic numeral conversion tests
- `tests/stores/readingStore.test.ts` - Reading store persistence tests
- `tests/stores/selectionStore.test.ts` - Selection store state tests
- `tests/hooks/useSearch.test.ts` - Search filter logic tests
- `tests/data/quranRepository.test.ts` - Repository query tests

## Decisions Made
- Used expo-sqlite over WatermelonDB for Quran text (read-only data, simpler, first-party)
- Downgraded from Jest 30 to Jest 29 due to incompatibility with Expo SDK 55 winter runtime sandbox
- Used `/verses/by_chapter` API endpoint instead of `/quran/verses/uthmani` (latter lacks juz/hizb/page metadata)
- Sourced KFGQPC font from thetruetruth/quran-data-kfgqpc GitHub repo
- Adapted project structure to use `src/app/` for Expo Router (SDK 55 default) instead of root `app/`
- Used `INSERT OR IGNORE` for juz data due to API returning duplicate entries (60 records for 30 juz)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed API endpoint for fetching ayah data**
- **Found during:** Task 2 (Database build script)
- **Issue:** Plan specified `/quran/verses/uthmani` endpoint which only returns `id`, `verse_key`, and `text_uthmani` -- missing `juz_number`, `hizb_number`, `page_number`
- **Fix:** Switched to `/verses/by_chapter` endpoint with explicit field parameters and pagination handling
- **Files modified:** src/data/seed/buildQuranDb.ts
- **Verification:** All 6236 ayahs populated with complete metadata
- **Committed in:** b8fd2db

**2. [Rule 1 - Bug] Fixed foreign key constraint in database seeding**
- **Found during:** Task 2 (Database build script)
- **Issue:** Ayahs were inserted before surahs, violating FOREIGN KEY constraint on surah_number
- **Fix:** Reordered to insert surahs first (with placeholder juz_start), then ayahs, then update juz_start
- **Files modified:** src/data/seed/buildQuranDb.ts
- **Verification:** Database builds without constraint errors
- **Committed in:** b8fd2db

**3. [Rule 1 - Bug] Fixed duplicate juz entries from API**
- **Found during:** Task 2 (Database build script)
- **Issue:** Quran Foundation API /juzs endpoint returns 60 entries (duplicates for each juz number)
- **Fix:** Used `INSERT OR IGNORE` to skip duplicate juz_number entries
- **Files modified:** src/data/seed/buildQuranDb.ts
- **Verification:** Exactly 30 juz entries in database
- **Committed in:** b8fd2db

**4. [Rule 3 - Blocking] Downgraded Jest 30 to Jest 29**
- **Found during:** Task 1 (Jest test infrastructure)
- **Issue:** Jest 30 sandbox mode throws "ReferenceError: You are trying to import a file outside of the scope of the test code" due to Expo SDK 55 winter runtime
- **Fix:** Installed jest@29 which is compatible with jest-expo and Expo SDK 55
- **Files modified:** package.json, package-lock.json
- **Verification:** All 58 tests pass
- **Committed in:** d85b34d

**5. [Rule 3 - Blocking] Fixed quranRepository test mock setup**
- **Found during:** Task 1 (Test files)
- **Issue:** Jest factory hoisting caused mock functions to be undefined when mock object was created
- **Fix:** Used object literal pattern with `mockDb = { getAllAsync: jest.fn(), getFirstAsync: jest.fn() }` instead of separate variables
- **Files modified:** tests/data/quranRepository.test.ts
- **Verification:** All 8 repository tests pass
- **Committed in:** d85b34d

---

**Total deviations:** 5 auto-fixed (3 bugs, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correctness and functionality. No scope creep.

## Issues Encountered
- KFGQPC font file not available from several initially tried GitHub URLs (404 or HTML redirect pages). Successfully found at thetruetruth/quran-data-kfgqpc repo under hafs/font/hafs.18.ttf.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Foundation complete with all stores, hooks, types, database, and navigation skeleton
- Plan 01-02 (Home screen) can consume useSurahList, useSearch, useJuzList hooks and the tab navigation
- Plan 01-03 (Quran reader) can consume useQuranText hook and the surah/[id] route
- Plan 01-04 (Onboarding) can consume the onboarding route and readingStore
- Arabic text rendering with KFGQPC font needs real-device testing (known risk from research)

## Self-Check: PASSED

All 30 key files verified present. Both task commits (d85b34d, b8fd2db) verified in git history.

---
*Phase: 01-foundation-and-quran-display*
*Completed: 2026-03-22*

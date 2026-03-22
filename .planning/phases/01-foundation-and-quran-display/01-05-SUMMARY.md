---
phase: 01-foundation-and-quran-display
plan: 05
subsystem: ui
tags: [flashlist, scrollToIndex, zustand, mmkv, react-hooks, useCallback]

# Dependency graph
requires:
  - phase: 01-foundation-and-quran-display
    provides: QuranReader with FlashList, readingStore with MMKV persistence, useSurahList/useJuzList hooks
provides:
  - Ayah-index-based scroll restoration on surah re-open via FlashList.scrollToIndex
  - Retry functions exposed from useSurahList and useJuzList hooks
  - Functional "Try Again" button on home screen error state
affects: [02-asr-proof-of-concept, 03-recitation-loop]

# Tech tracking
tech-stack:
  added: []
  patterns: [useCallback-based retry pattern for data hooks]

key-files:
  created: []
  modified:
    - src/stores/readingStore.ts
    - src/data/types.ts
    - src/hooks/useLastRead.ts
    - src/components/quran/QuranReader.tsx
    - src/app/surah/[id].tsx
    - src/hooks/useSurahList.ts
    - src/hooks/useJuzList.ts
    - src/app/(tabs)/index.tsx
    - tests/stores/readingStore.test.ts

key-decisions:
  - "Removed scrollOffset entirely from store/types/hooks rather than fixing it -- ayah-index-based restoration via scrollToIndex is deterministic across devices and font sizes"
  - "Used useCallback for load functions in data hooks to enable both mount-time fetch and external retry with stable references"

patterns-established:
  - "Data hooks expose retry via useCallback-wrapped load function: return { data, loading, error, retry: load }"
  - "Scroll restoration uses scrollToIndex with ayah number lookup instead of pixel offsets"

requirements-completed: [QTEXT-01, QTEXT-02, QTEXT-03, QTEXT-04, UI-01, UI-04]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 01 Plan 05: Gap Closure Summary

**Ayah-index-based scroll restore via FlashList.scrollToIndex and functional retry on home screen error state**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T19:51:21Z
- **Completed:** 2026-03-22T19:54:42Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Replaced broken pixel-offset scroll restoration with deterministic ayah-index-based scrollToIndex -- returning to a surah now scrolls to the exact last-read ayah
- Removed dead `scrollOffset` / `lastReadScrollOffset` fields from store, types, and hooks (clean API, no dead state)
- Added retry functions to useSurahList and useJuzList hooks using useCallback pattern
- Wired "Try Again" button on home screen to actually re-fetch data from both hooks

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix bookmark scroll restore with ayah-index-based restoration** - `55baa00` (fix)
2. **Task 2: Fix empty handleRetry on home screen error state** - `146e72d` (fix)

## Files Created/Modified
- `src/stores/readingStore.ts` - Removed lastReadScrollOffset, simplified setLastRead to (surah, ayah)
- `src/data/types.ts` - Removed scrollOffset from LastReadPosition interface
- `src/hooks/useLastRead.ts` - Removed scrollOffset from hook, simplified savePosition signature
- `src/components/quran/QuranReader.tsx` - Replaced scrollToOffset with scrollToIndex, changed prop to initialAyahNumber
- `src/app/surah/[id].tsx` - Pass initialAyahNumber from lastRead.ayahNumber instead of scrollOffset
- `src/hooks/useSurahList.ts` - Extracted load into useCallback, exposed as retry
- `src/hooks/useJuzList.ts` - Extracted load into useCallback, exposed as retry
- `src/app/(tabs)/index.tsx` - Wired surahRetry and juzRetry into handleRetry
- `tests/stores/readingStore.test.ts` - Updated to match new 2-arg setLastRead API

## Decisions Made
- Removed scrollOffset entirely rather than fixing the always-0 bug -- ayah-index-based restoration via scrollToIndex is deterministic across devices/font sizes and simpler
- Used useCallback for load functions in data hooks to enable both mount-time fetch and external retry with stable function references
- Reordered useEffect after useMemo in QuranReader to fix variable-before-declaration issue

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed data variable used before declaration in QuranReader**
- **Found during:** Task 1 (scroll restore implementation)
- **Issue:** The scrollToIndex useEffect referenced `data` before the useMemo that defines it, causing TS2448 error
- **Fix:** Moved the useEffect to after the data useMemo definition
- **Files modified:** src/components/quran/QuranReader.tsx
- **Verification:** TypeScript no longer reports TS2448/TS2454 for QuranReader
- **Committed in:** 55baa00 (Task 1 commit)

**2. [Rule 1 - Bug] Updated readingStore tests for new API**
- **Found during:** Task 1 (store API change)
- **Issue:** Tests used 3-arg setLastRead and referenced lastReadScrollOffset which no longer exists
- **Fix:** Updated tests to use 2-arg setLastRead and removed scrollOffset assertions
- **Files modified:** tests/stores/readingStore.test.ts
- **Verification:** TypeScript no longer reports errors in test file
- **Committed in:** 55baa00 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 01 is now fully complete with all verification gaps closed
- QTEXT-04 (bookmark and resume) requirement fulfilled with deterministic scroll restore
- Home screen error recovery is functional
- Ready to proceed to Phase 02 (ASR proof-of-concept)

---
*Phase: 01-foundation-and-quran-display*
*Completed: 2026-03-22*

## Self-Check: PASSED
- All 9 modified files exist on disk
- Commit 55baa00 (Task 1) found in git log
- Commit 146e72d (Task 2) found in git log

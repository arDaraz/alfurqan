---
phase: quick
plan: 260325-wmk
type: execute
wave: 1
depends_on: []
files_modified:
  - src/stores/readingStore.ts
  - src/data/quranRepository.ts
  - src/data/types.ts
  - src/actions/ayahActions.ts
  - src/components/quran/MushafScreenLayout.tsx
  - src/components/quran/MushafReader.tsx
  - tests/stores/readingStore.test.ts
  - tests/actions/ayahActions.test.ts
autonomous: true
must_haves:
  truths:
    - "Copy action puts selected ayah text (Uthmani) onto the clipboard"
    - "Share action opens the native share sheet with selected ayah text"
    - "Bookmark action persists a bookmark entry to readingStore (survives app restart)"
    - "Play, tafsir, wordByWord actions console.log their action name + ayah range"
  artifacts:
    - path: "src/actions/ayahActions.ts"
      provides: "Central action handler dispatching all 6 AyahActionType actions"
      exports: ["handleAyahAction"]
    - path: "src/stores/readingStore.ts"
      provides: "Bookmark array with add/remove/toggle operations"
      contains: "bookmarks"
    - path: "src/data/quranRepository.ts"
      provides: "getAyahTextRange query for fetching Uthmani text by surah+range"
      exports: ["getAyahTextRange"]
  key_links:
    - from: "src/components/quran/MushafScreenLayout.tsx"
      to: "src/actions/ayahActions.ts"
      via: "onAyahAction prop wired to handleAyahAction"
      pattern: "handleAyahAction"
    - from: "src/actions/ayahActions.ts"
      to: "src/stores/readingStore.ts"
      via: "toggleBookmark call for bookmark action"
      pattern: "useReadingStore.getState"
    - from: "src/actions/ayahActions.ts"
      to: "src/data/quranRepository.ts"
      via: "getAyahTextRange call for copy/share actions"
      pattern: "getAyahTextRange"
---

<objective>
Wire up the 6 ayah popup actions (copy, share, bookmark, play, tafsir, wordByWord) so tapping a button in AyahPopup executes the corresponding behavior.

Purpose: Currently AyahPopup renders buttons but onAyahAction is not passed through MushafScreenLayout, so taps do nothing. This wires the full action pipeline.
Output: Working copy-to-clipboard, native share sheet, persisted bookmarks, and console.log placeholders for the remaining 3 actions.
</objective>

<execution_context>
@/Users/ahmeddaraz/VibeCoding/tasmi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/ahmeddaraz/VibeCoding/tasmi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/quran/AyahPopup.tsx
@src/components/quran/MushafReader.tsx
@src/components/quran/MushafScreenLayout.tsx
@src/stores/readingStore.ts
@src/data/quranRepository.ts
@src/data/types.ts

<interfaces>
<!-- Key types and contracts the executor needs. -->

From src/data/types.ts:
```typescript
export interface AyahSelection {
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export type AyahActionType = 'play' | 'tafsir' | 'bookmark' | 'copy' | 'share' | 'wordByWord';
```

From src/components/quran/MushafReader.tsx:
```typescript
interface MushafReaderProps {
  initialPage: number;
  onPageChange?: (pageNumber: number) => void;
  onAyahAction?: (action: AyahActionType, selection: AyahSelection) => void;
}
// handleAction already calls onAyahAction?.(action, sel) then clears selection
```

From src/stores/readingStore.ts:
```typescript
interface ReadingState {
  lastReadSurah: number | null;
  lastReadAyah: number | null;
  lastReadPage: number | null;
  hasCompletedOnboarding: boolean;
  setLastRead: (surah: number, ayah: number) => void;
  setLastReadPage: (page: number) => void;
  completeOnboarding: () => void;
}
// Uses zustand + persist with MMKV storage
```

From src/data/quranRepository.ts:
```typescript
export async function getAyahsBySurah(surahNumber: number): Promise<Ayah[]>;
// No range query exists yet -- must add getAyahTextRange
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add bookmark state to readingStore, add getAyahTextRange to repository, create ayahActions handler</name>
  <files>
    src/data/types.ts,
    src/data/quranRepository.ts,
    src/stores/readingStore.ts,
    src/actions/ayahActions.ts,
    tests/stores/readingStore.test.ts,
    tests/actions/ayahActions.test.ts
  </files>
  <behavior>
    - readingStore: bookmarks starts as empty array
    - readingStore: addBookmark adds a Bookmark to the array
    - readingStore: removeBookmark removes a bookmark by surah+ayah
    - readingStore: toggleBookmark adds if not present, removes if present
    - readingStore: bookmarks array persists (uses existing MMKV persist)
    - getAyahTextRange(surahNumber, startAyah, endAyah) returns joined Uthmani text string
    - handleAyahAction('copy', sel) copies text to clipboard via expo-clipboard
    - handleAyahAction('share', sel) triggers native share via expo-sharing
    - handleAyahAction('bookmark', sel) calls toggleBookmark on readingStore
    - handleAyahAction('play'|'tafsir'|'wordByWord', sel) logs to console
  </behavior>
  <action>
    1. Install expo-clipboard and expo-sharing:
       `npx expo install expo-clipboard expo-sharing`

    2. Add `Bookmark` interface to `src/data/types.ts`:
       ```typescript
       export interface Bookmark {
         surahNumber: number;
         ayahNumber: number;
         createdAt: number; // Date.now()
       }
       ```

    3. Update `src/stores/readingStore.ts`:
       - Import `Bookmark` from types.
       - Add to ReadingState interface: `bookmarks: Bookmark[]`, `addBookmark: (surah: number, ayah: number) => void`, `removeBookmark: (surah: number, ayah: number) => void`, `toggleBookmark: (surah: number, ayah: number) => void`.
       - Implement: `addBookmark` pushes `{ surahNumber, ayahNumber, createdAt: Date.now() }` to bookmarks array (no-op if already exists). `removeBookmark` filters out matching entry. `toggleBookmark` checks existence by surah+ayah match, calls add or remove accordingly.
       - Default `bookmarks: []` in initial state.

    4. Add `getAyahTextRange` to `src/data/quranRepository.ts`:
       ```typescript
       export async function getAyahTextRange(
         surahNumber: number,
         startAyah: number,
         endAyah: number
       ): Promise<string> {
         const db = await getDatabase();
         const rows = await db.getAllAsync<{ text_uthmani: string }>(
           'SELECT text_uthmani FROM ayahs WHERE surah_number = ? AND ayah_number >= ? AND ayah_number <= ? ORDER BY ayah_number',
           [surahNumber, startAyah, endAyah]
         );
         return rows.map((r) => r.text_uthmani).join(' ');
       }
       ```
       Note: AyahSelection has startSurah/endSurah but current UI only selects within a single page (same surah). For now, use startSurah only. Add a TODO comment noting cross-surah support for the future.

    5. Create `src/actions/ayahActions.ts`:
       ```typescript
       import * as Clipboard from 'expo-clipboard';
       import { shareAsync } from 'expo-sharing';
       import { getAyahTextRange } from '../data/quranRepository';
       import { useReadingStore } from '../stores/readingStore';
       import type { AyahActionType, AyahSelection } from '../data/types';

       export async function handleAyahAction(
         action: AyahActionType,
         selection: AyahSelection
       ): Promise<void> {
         const { startSurah, startAyah, endSurah, endAyah } = selection;

         switch (action) {
           case 'copy': {
             const text = await getAyahTextRange(startSurah, startAyah, endAyah);
             await Clipboard.setStringAsync(text);
             break;
           }
           case 'share': {
             const text = await getAyahTextRange(startSurah, startAyah, endAyah);
             // expo-sharing shareAsync requires a file URI; for plain text, use the RN Share API instead
             const { Share } = require('react-native');
             await Share.share({ message: text });
             break;
           }
           case 'bookmark': {
             useReadingStore.getState().toggleBookmark(startSurah, startAyah);
             break;
           }
           case 'play': {
             console.log(`[AyahAction] play: surah ${startSurah}, ayahs ${startAyah}-${endAyah}`);
             break;
           }
           case 'tafsir': {
             console.log(`[AyahAction] tafsir: surah ${startSurah}, ayahs ${startAyah}-${endAyah}`);
             break;
           }
           case 'wordByWord': {
             console.log(`[AyahAction] wordByWord: surah ${startSurah}, ayahs ${startAyah}-${endAyah}`);
             break;
           }
         }
       }
       ```
       IMPORTANT: expo-sharing's `shareAsync` requires a file URI, not plain text. Use React Native's built-in `Share.share({ message })` for text sharing instead. Do NOT use expo-sharing for text -- only install expo-clipboard (skip expo-sharing install since we use RN Share).

    6. Add tests in `tests/stores/readingStore.test.ts` for bookmark operations:
       - toggleBookmark adds when not present
       - toggleBookmark removes when present
       - addBookmark is idempotent (no duplicates)
       - removeBookmark on non-existent is no-op

    7. Create `tests/actions/ayahActions.test.ts`:
       - Mock expo-clipboard, react-native Share, quranRepository
       - Test copy action calls Clipboard.setStringAsync with fetched text
       - Test share action calls Share.share with fetched text
       - Test bookmark action calls toggleBookmark
       - Test play/tafsir/wordByWord actions call console.log
  </action>
  <verify>
    <automated>cd /Users/ahmeddaraz/VibeCoding/tasmi && npx jest tests/stores/readingStore.test.ts tests/actions/ayahActions.test.ts --no-coverage 2>&1 | tail -20</automated>
  </verify>
  <done>
    - readingStore has bookmarks array with add/remove/toggle
    - getAyahTextRange fetches Uthmani text for an ayah range
    - handleAyahAction dispatches all 6 action types correctly
    - All new tests pass
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire handleAyahAction through MushafScreenLayout to MushafReader</name>
  <files>
    src/components/quran/MushafScreenLayout.tsx,
    src/components/quran/MushafReader.tsx
  </files>
  <action>
    1. In `src/components/quran/MushafScreenLayout.tsx`:
       - Import `handleAyahAction` from `../../actions/ayahActions`.
       - Import `AyahActionType` and `AyahSelection` types from `../../data/types`.
       - Create a `useCallback` wrapper:
         ```typescript
         const handleAction = useCallback((action: AyahActionType, selection: AyahSelection) => {
           handleAyahAction(action, selection);
         }, []);
         ```
       - Pass `onAyahAction={handleAction}` to the `<MushafReader>` component (line 77).

    2. No changes needed in MushafReader.tsx -- it already accepts `onAyahAction` prop and pipes it through `handleAction` callback to `AyahPopup`'s `onAction`. The full chain is:
       - MushafScreenLayout passes `onAyahAction` to MushafReader
       - MushafReader's `handleAction` calls `onAyahAction?.(action, sel)` then clears selection
       - AyahPopup's button `onPress` calls `onAction(a.key, selection)` which triggers MushafReader's `handleAction`

    3. Verify the import chain compiles: `npx tsc --noEmit` (or at minimum ensure no red squiggles in the import paths).
  </action>
  <verify>
    <automated>cd /Users/ahmeddaraz/VibeCoding/tasmi && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - MushafScreenLayout passes handleAyahAction to MushafReader via onAyahAction prop
    - Full action chain works: AyahPopup button press -> MushafReader handleAction -> MushafScreenLayout handleAction -> handleAyahAction
    - TypeScript compiles with no errors
  </done>
</task>

</tasks>

<verification>
1. `npx jest tests/stores/readingStore.test.ts tests/actions/ayahActions.test.ts --no-coverage` -- all tests pass
2. `npx tsc --noEmit` -- no type errors
3. Manual: In the app, long-press an ayah in Mushaf view, tap Copy, then paste in Notes -- Uthmani text appears
4. Manual: Tap Share -- native share sheet opens with ayah text
5. Manual: Tap Bookmark -- no crash (bookmark persisted in MMKV, visible in debug tools)
6. Manual: Tap Play/Tafsir/Word -- console.log appears in Metro bundler output
</verification>

<success_criteria>
- All 6 ayah popup actions execute without error when tapped
- Copy puts Uthmani Arabic text on the system clipboard
- Share opens the native OS share sheet with the ayah text
- Bookmark toggles a persisted entry in readingStore.bookmarks
- Play, tafsir, wordByWord log their action + range to console
- All tests pass, TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260325-wmk-wire-up-the-6-ayah-popup-actions-copy-sh/260325-wmk-SUMMARY.md`
</output>

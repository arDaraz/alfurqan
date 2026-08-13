# Bookmarks (Reading & Recitation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-bucket bookmark feature with a Bookmarks screen that organizes saved ayat under Reading and Recitation categories, with a category-picker sheet on save, swipe-to-delete in the list, and an icon entry point from the Home `BrandBar`.

**Architecture:** Extend the existing MMKV-persisted `readingStore` `Bookmark` shape with a `category: 'reading' | 'recitation'` field (identity is now the `(surah, ayah, category)` tuple — same ayah can live in both categories). Save still happens inline in the reader / search, but instead of a direct toggle, the action opens a category-picker bottom sheet that commits a diff. A new stack route `/bookmarks` renders pill-tabs over a FlashList per category, with `Swipeable` rows that lazy-load an ayah text preview. The Home `BrandBar` grows a trailing icon button that pushes to that route. The root layout is wrapped in `GestureHandlerRootView` so `Swipeable` works reliably on native.

**Tech Stack:** React Native (Expo SDK 55), Expo Router (file-based), Zustand + MMKV, react-native-gesture-handler 2.30 `Swipeable`, FlashList, `expo-sqlite`, NativeWind/StyleSheet, Jest + `@testing-library/react-native`.

---

## File Structure

**New:**
- `src/app/bookmarks.tsx` — route entry; renders `BookmarksScreen`.
- `src/components/bookmarks/BookmarksScreen.tsx` — top-level layout: header, pill tabs, FlashList per tab, empty states.
- `src/components/bookmarks/BookmarkRow.tsx` — single row with ayah preview hook and `Swipeable` delete action.
- `src/components/bookmarks/__tests__/BookmarksScreen.test.tsx`
- `src/components/quran/BookmarkCategorySheet.tsx` — bottom-sheet category picker, fires `onCommit({ added, removed })`.
- `src/components/quran/__tests__/BookmarkCategorySheet.test.tsx`
- `src/components/quran/__tests__/MushafScreenLayout.bookmarkUndo.test.tsx`
- `src/stores/__tests__/readingStore.bookmarks.test.ts`
- `src/data/__tests__/quranRepository.bookmarkPreview.test.ts`
- `tests/components/home/BrandBar.test.tsx` — bookmark icon button presence, label, navigation.

**Modified:**
- `src/app/_layout.tsx` — wrap the tree in `GestureHandlerRootView`.
- `src/data/types.ts` — add `BookmarkCategory`, extend `Bookmark`.
- `src/stores/readingStore.ts` — category-scoped API, persist `version: 1` + `migrate`.
- `src/data/quranRepository.ts` — add `getAyahPreview`.
- `src/components/home/BrandBar.tsx` — trailing icon button.
- `src/components/quran/AyahPopup.tsx` — no functional change; visual indicator that bookmark is "active in any category" comes via prop wiring at MushafReader.
- `src/components/quran/MushafReader.tsx` — remove inline page-bookmark toggle and snackbar; lift to `MushafScreenLayout` via a new `onPageBookmarkRequest` callback.
- `src/components/quran/MushafScreenLayout.tsx` — host the category sheet + snackbar; pass `onRequestBookmark` callback into `handleAyahAction`.
- `src/components/quran/MushafBottomToolbar.tsx` — unchanged props; reader passes the new handler.
- `src/components/quran/BookmarkSavedSnackbar.tsx` — accept resulting category set and snapshot for full-fidelity undo.
- `src/components/search/SearchScreen.tsx` — host the same sheet; pass `onRequestBookmark` into `handleAyahAction`.
- `src/actions/ayahActions.ts` — `bookmark` case calls `callbacks.onRequestBookmark(selection)` (no store mutation here); keeps `setLastRead`.
- `tests/actions/ayahActions.test.ts` — update bookmark tests for callback-based bookmark requests.
- `tests/stores/readingStore.test.ts` — update legacy bookmark API tests to include category.
- `src/stores/__tests__/readingStore.activity.test.ts` — update bookmark setup to include category.
- `src/constants/strings.ts` — add `bookmarks` namespace + four `savedSubtitle*` factories.
- `src/components/quran/__tests__/BookmarkSavedSnackbar.test.tsx` — update for category-aware subtitles.
- `src/components/quran/__tests__/MushafScreenLayout.bookmarkUndo.test.tsx` — focused integration coverage for exact undo restore.
- `src/components/quran/__tests__/MushafBottomToolbar.test.tsx` — already exists; no schema change to the toolbar, so this test stays as is.
- `src/components/search/__tests__/SearchScreen.actions.test.tsx` — update: bookmark action opens the sheet rather than toggling directly.

---

## Task 1: Type & category enum

**Files:**
- Modify: `src/data/types.ts:72-76`

- [ ] **Step 1: Extend the `Bookmark` interface**

Replace the existing block at `src/data/types.ts:72-76`:

```ts
export type BookmarkCategory = 'reading' | 'recitation';

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  category: BookmarkCategory;
  createdAt: number; // Date.now()
}
```

- [ ] **Step 2: Run typecheck to confirm callers fail**

Run: `npx tsc --noEmit`
Expected: errors in `src/stores/readingStore.ts` (existing `addBookmark`/`removeBookmark` push `Bookmark` without `category`), `src/components/quran/MushafReader.tsx` (calls signature mismatch), and `src/actions/ayahActions.ts`. These will be fixed in following tasks.

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(bookmarks): add BookmarkCategory to Bookmark type"
```

---

## Task 2: Strings namespace and four `savedSubtitle*` factories

**Files:**
- Modify: `src/constants/strings.ts:134-139` (Arabic `bookmark` block), `src/constants/strings.ts:314-319` (English `bookmark` block); append new `bookmarks` namespace in both bundles.

- [ ] **Step 1: Replace the Arabic `bookmark` block with category-aware factories**

In `src/constants/strings.ts` at the `// Bookmark snackbar` block in the `ar` bundle (around line 133-139), replace with:

```ts
  // Bookmark snackbar
  bookmark: {
    savedTitle: 'تم حفظ الصفحة',
    savedSubtitleReading: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · صفحة ${page} · جزء ${juz} · للقراءة`,
    savedSubtitleRecitation: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · صفحة ${page} · جزء ${juz} · للتلاوة`,
    savedSubtitleBoth: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · صفحة ${page} · جزء ${juz} · للقراءة والتلاوة`,
    savedSubtitleRemoved: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · صفحة ${page} · جزء ${juz} · تم الحذف`,
    undo: 'تراجع',
  },
```

- [ ] **Step 2: Add the Arabic `bookmarks` namespace**

Append immediately after the `bookmark` block above, still inside the `ar` bundle:

```ts
  bookmarks: {
    screenTitle: 'الإشارات المرجعية',
    tabReading: 'القراءة',
    tabRecitation: 'التلاوة',
    openLabel: 'افتح الإشارات المرجعية',
    emptyReading: 'لم تحفظ آيات للقراءة بعد',
    emptyRecitation: 'لم تحفظ آيات للتلاوة بعد',
    deleteAction: 'حذف',
    sheetTitle: 'حفظ الإشارة المرجعية',
    sheetSave: 'حفظ',
    sheetRemoveAll: 'حذف الكل',
    categoryReading: 'القراءة',
    categoryRecitation: 'التلاوة',
    countLabel: (n: number | string) => `${n}`,
  },
```

- [ ] **Step 3: Mirror the English `bookmark` block**

In the `en` bundle (around line 314-319), replace with:

```ts
  bookmark: {
    savedTitle: 'Page saved',
    savedSubtitleReading: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · Page ${page} · Juz ${juz} · Reading`,
    savedSubtitleRecitation: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · Page ${page} · Juz ${juz} · Recitation`,
    savedSubtitleBoth: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · Page ${page} · Juz ${juz} · Reading & Recitation`,
    savedSubtitleRemoved: (surahName: string, page: string | number, juz: string | number) =>
      `${surahName} · Page ${page} · Juz ${juz} · Removed`,
    undo: 'Undo',
  },
```

- [ ] **Step 4: Mirror the English `bookmarks` namespace**

Append after the English `bookmark` block:

```ts
  bookmarks: {
    screenTitle: 'Bookmarks',
    tabReading: 'Reading',
    tabRecitation: 'Recitation',
    openLabel: 'Open bookmarks',
    emptyReading: 'No reading bookmarks yet',
    emptyRecitation: 'No recitation bookmarks yet',
    deleteAction: 'Delete',
    sheetTitle: 'Save bookmark',
    sheetSave: 'Save',
    sheetRemoveAll: 'Remove all',
    categoryReading: 'Reading',
    categoryRecitation: 'Recitation',
    countLabel: (n: number | string) => `${n}`,
  },
```

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: existing `bookmark.savedSubtitle(...)` callsites in `BookmarkSavedSnackbar.tsx` now fail to compile. They will be fixed in Task 6.

- [ ] **Step 6: Commit**

```bash
git add src/constants/strings.ts
git commit -m "feat(bookmarks): add category-aware strings and four snackbar variants"
```

---

## Task 3: `readingStore` category-scoped API + migration

**Files:**
- Test: `src/stores/__tests__/readingStore.bookmarks.test.ts` (new)
- Modify: `src/stores/readingStore.ts`

- [ ] **Step 1: Write the failing test file**

Create `src/stores/__tests__/readingStore.bookmarks.test.ts`:

```ts
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

import { act } from '@testing-library/react-native';
import { useReadingStore } from '../readingStore';
import type { Bookmark } from '../../data/types';

function resetStore() {
  useReadingStore.setState({
    bookmarks: [],
    lastReadSurah: null,
    lastReadAyah: null,
    lastReadPage: null,
    lastReadJuz: null,
    lastReadAt: null,
    streakDays: 0,
    streakLastReadDate: null,
    hasCompletedOnboarding: false,
  } as Partial<ReturnType<typeof useReadingStore.getState>> as any);
}

describe('readingStore bookmarks', () => {
  beforeEach(() => resetStore());

  it('adds a bookmark with category', () => {
    act(() => useReadingStore.getState().addBookmark(2, 255, 'reading'));
    const bms = useReadingStore.getState().bookmarks;
    expect(bms).toHaveLength(1);
    expect(bms[0]).toMatchObject({ surahNumber: 2, ayahNumber: 255, category: 'reading' });
    expect(typeof bms[0].createdAt).toBe('number');
  });

  it('is a no-op when the exact (surah, ayah, category) already exists', () => {
    act(() => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(2, 255, 'reading');
    });
    expect(useReadingStore.getState().bookmarks).toHaveLength(1);
  });

  it('stores the same ayah twice under different categories', () => {
    act(() => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(2, 255, 'recitation');
    });
    const bms = useReadingStore.getState().bookmarks;
    expect(bms).toHaveLength(2);
    expect(bms.map((b) => b.category).sort()).toEqual(['reading', 'recitation']);
  });

  it('removeBookmark filters by category', () => {
    act(() => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(2, 255, 'recitation');
      useReadingStore.getState().removeBookmark(2, 255, 'reading');
    });
    const bms = useReadingStore.getState().bookmarks;
    expect(bms).toHaveLength(1);
    expect(bms[0].category).toBe('recitation');
  });

  it('toggleBookmark is category-scoped', () => {
    act(() => useReadingStore.getState().toggleBookmark(2, 255, 'reading'));
    expect(useReadingStore.getState().bookmarks).toHaveLength(1);
    act(() => useReadingStore.getState().toggleBookmark(2, 255, 'reading'));
    expect(useReadingStore.getState().bookmarks).toHaveLength(0);
    act(() => {
      useReadingStore.getState().toggleBookmark(2, 255, 'reading');
      useReadingStore.getState().toggleBookmark(2, 255, 'recitation');
    });
    expect(useReadingStore.getState().bookmarks).toHaveLength(2);
  });

  it('getBookmarkCategories returns the set of categories for an ayah', () => {
    act(() => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(2, 255, 'recitation');
      useReadingStore.getState().addBookmark(36, 1, 'recitation');
    });
    expect(useReadingStore.getState().getBookmarkCategories(2, 255).sort()).toEqual([
      'reading',
      'recitation',
    ]);
    expect(useReadingStore.getState().getBookmarkCategories(36, 1)).toEqual(['recitation']);
    expect(useReadingStore.getState().getBookmarkCategories(1, 1)).toEqual([]);
  });

  it('migrate(v0 → v1) tags legacy bookmarks with category="reading"', () => {
    // simulate the persisted v0 shape (no category) by calling the migrate fn directly
    const legacy = {
      bookmarks: [
        { surahNumber: 2, ayahNumber: 255, createdAt: 1700000000000 },
        { surahNumber: 36, ayahNumber: 1, createdAt: 1700000000000 },
      ],
    } as any;
    const { migrate } = require('../readingStore') as {
      migrate: (state: any, version: number) => any;
    };
    const migrated: { bookmarks: Bookmark[] } = migrate(legacy, 0);
    expect(migrated.bookmarks).toHaveLength(2);
    expect(migrated.bookmarks.every((b) => b.category === 'reading')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

Run: `npm test -- --testPathPattern="readingStore.bookmarks"`
Expected: FAILS — `addBookmark`/`removeBookmark`/`toggleBookmark` signature mismatches, `getBookmarkCategories` undefined, `migrate` not exported.

- [ ] **Step 3: Update `readingStore.ts`**

Replace the entire file `src/stores/readingStore.ts`:

```ts
import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { Bookmark, BookmarkCategory } from '../data/types';

const mmkv = createMMKV({ id: 'reading-store' });

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  getItem: (name) => {
    return mmkv.getString(name) ?? null;
  },
  removeItem: (name) => {
    mmkv.remove(name);
  },
};

interface ReadingState {
  lastReadSurah: number | null;
  lastReadAyah: number | null;
  lastReadPage: number | null;
  lastReadJuz: number | null;
  lastReadAt: number | null;
  streakDays: number;
  streakLastReadDate: string | null;
  hasCompletedOnboarding: boolean;
  bookmarks: Bookmark[];
  setLastRead: (
    surah: number,
    ayah: number,
    juz: number,
    page: number,
    now?: Date
  ) => void;
  completeOnboarding: () => void;
  addBookmark: (surah: number, ayah: number, category: BookmarkCategory) => void;
  removeBookmark: (surah: number, ayah: number, category: BookmarkCategory) => void;
  toggleBookmark: (surah: number, ayah: number, category: BookmarkCategory) => void;
  getBookmarkCategories: (surah: number, ayah: number) => BookmarkCategory[];
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nextStreak(previousDays: number, previousDate: string | null, today: string): number {
  if (previousDate === today) return previousDays || 1;
  if (previousDate === null) return 1;

  const previousMs = new Date(`${previousDate}T00:00:00`).getTime();
  const todayMs = new Date(`${today}T00:00:00`).getTime();
  const diffDays = Math.round((todayMs - previousMs) / 86_400_000);

  return diffDays === 1 ? previousDays + 1 : 1;
}

// Exported for unit testing — applies any necessary forward-migrations to the
// persisted slice. Called by zustand/persist with the prior `version`.
export function migrate(state: any, version: number): any {
  if (!state || typeof state !== 'object') return state;
  if (version < 1 && Array.isArray(state.bookmarks)) {
    state.bookmarks = state.bookmarks.map((b: any) =>
      b && typeof b === 'object' && !b.category ? { ...b, category: 'reading' } : b
    );
  }
  return state;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadPage: null,
      lastReadJuz: null,
      lastReadAt: null,
      streakDays: 0,
      streakLastReadDate: null,
      hasCompletedOnboarding: false,
      bookmarks: [],
      setLastRead: (surah, ayah, juz, page, now = new Date()) => {
        const today = localDateKey(now);
        const { streakDays, streakLastReadDate } = get();
        set({
          lastReadSurah: surah,
          lastReadAyah: ayah,
          lastReadJuz: juz,
          lastReadPage: page,
          lastReadAt: now.getTime(),
          streakDays: nextStreak(streakDays, streakLastReadDate, today),
          streakLastReadDate: today,
        });
      },
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      addBookmark: (surah, ayah, category) => {
        const exists = get().bookmarks.some(
          (b) =>
            b.surahNumber === surah && b.ayahNumber === ayah && b.category === category
        );
        if (!exists) {
          set({
            bookmarks: [
              ...get().bookmarks,
              { surahNumber: surah, ayahNumber: ayah, category, createdAt: Date.now() },
            ],
          });
        }
      },
      removeBookmark: (surah, ayah, category) =>
        set({
          bookmarks: get().bookmarks.filter(
            (b) =>
              !(b.surahNumber === surah && b.ayahNumber === ayah && b.category === category)
          ),
        }),
      toggleBookmark: (surah, ayah, category) => {
        const exists = get().bookmarks.some(
          (b) =>
            b.surahNumber === surah && b.ayahNumber === ayah && b.category === category
        );
        if (exists) {
          get().removeBookmark(surah, ayah, category);
        } else {
          get().addBookmark(surah, ayah, category);
        }
      },
      getBookmarkCategories: (surah, ayah) =>
        get()
          .bookmarks.filter((b) => b.surahNumber === surah && b.ayahNumber === ayah)
          .map((b) => b.category),
    }),
    {
      name: 'reading-store',
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
      migrate,
    }
  )
);
```

- [ ] **Step 4: Run the test — confirm it passes**

Run: `npm test -- --testPathPattern="readingStore.bookmarks"`
Expected: PASS.

- [ ] **Step 5: Update legacy store tests that still call the old bookmark API**

Update `tests/stores/readingStore.test.ts` and `src/stores/__tests__/readingStore.activity.test.ts` so every `addBookmark`, `removeBookmark`, and `toggleBookmark` call includes an explicit category. Keep the legacy single-bucket intent by using `'reading'` in those tests unless the assertion specifically covers multi-category behavior.

Examples:

```ts
useReadingStore.getState().addBookmark(2, 255, 'reading');
useReadingStore.getState().removeBookmark(2, 255, 'reading');
useReadingStore.getState().toggleBookmark(2, 255, 'reading');
```

- [ ] **Step 6: Run the existing store tests to confirm no regression**

Run: `npm test -- --testPathPattern="readingStore"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/stores/readingStore.ts src/stores/__tests__/readingStore.bookmarks.test.ts src/stores/__tests__/readingStore.activity.test.ts tests/stores/readingStore.test.ts
git commit -m "feat(bookmarks): category-scoped store API with v1 migration"
```

---

## Task 4: `getAyahPreview` repository helper

**Files:**
- Test: `src/data/__tests__/quranRepository.bookmarkPreview.test.ts` (new)
- Modify: `src/data/quranRepository.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/quranRepository.bookmarkPreview.test.ts`:

```ts
import { getAyahPreview, __resetAyahPreviewCacheForTests } from '../quranRepository';

const longText =
  'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ';

jest.mock('../database', () => {
  const getAllAsync = jest.fn();
  return {
    __mock: { getAllAsync },
    getDatabase: async () => ({ getAllAsync }),
  };
});

const mock = (jest.requireMock('../database') as { __mock: { getAllAsync: jest.Mock } }).__mock;

describe('getAyahPreview', () => {
  beforeEach(() => {
    mock.getAllAsync.mockReset();
    __resetAyahPreviewCacheForTests();
  });

  it('returns the full text untruncated when shorter than the limit', async () => {
    mock.getAllAsync.mockResolvedValueOnce([{ text_uthmani: 'بِسْمِ اللَّهِ' }]);
    await expect(getAyahPreview(1, 1)).resolves.toBe('بِسْمِ اللَّهِ');
  });

  it('truncates to ~80 chars and appends an ellipsis', async () => {
    mock.getAllAsync.mockResolvedValueOnce([{ text_uthmani: longText }]);
    const preview = await getAyahPreview(2, 255);
    expect(preview.length).toBeLessThanOrEqual(81); // 80 chars + …
    expect(preview.endsWith('…')).toBe(true);
  });

  it('caches the result; second call does not hit the database', async () => {
    mock.getAllAsync.mockResolvedValueOnce([{ text_uthmani: longText }]);
    await getAyahPreview(2, 255);
    await getAyahPreview(2, 255);
    expect(mock.getAllAsync).toHaveBeenCalledTimes(1);
  });

  it('returns empty string when the ayah is not found', async () => {
    mock.getAllAsync.mockResolvedValueOnce([]);
    await expect(getAyahPreview(99, 99)).resolves.toBe('');
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

Run: `npm test -- --testPathPattern="quranRepository.bookmarkPreview"`
Expected: FAIL — `getAyahPreview` and `__resetAyahPreviewCacheForTests` are not exported.

- [ ] **Step 3: Add `getAyahPreview` to `quranRepository.ts`**

Append at the end of `src/data/quranRepository.ts` (after the existing `__resetAyahSearchCacheForTests` export around line 711):

```ts
const ayahPreviewCache = new Map<string, string>();
const PREVIEW_CHAR_LIMIT = 80;

export async function getAyahPreview(surahNumber: number, ayahNumber: number): Promise<string> {
  const key = `${surahNumber}:${ayahNumber}`;
  const cached = ayahPreviewCache.get(key);
  if (cached !== undefined) return cached;

  const db = await getDatabase();
  const rows = await db.getAllAsync<{ text_uthmani: string }>(
    'SELECT text_uthmani FROM ayahs WHERE surah_number = ? AND ayah_number = ? LIMIT 1',
    [surahNumber, ayahNumber]
  );
  const raw = rows[0]?.text_uthmani ?? '';
  const preview =
    raw.length <= PREVIEW_CHAR_LIMIT ? raw : `${raw.slice(0, PREVIEW_CHAR_LIMIT)}…`;
  ayahPreviewCache.set(key, preview);
  return preview;
}

export function __resetAyahPreviewCacheForTests(): void {
  ayahPreviewCache.clear();
}
```

- [ ] **Step 4: Run the test — confirm it passes**

Run: `npm test -- --testPathPattern="quranRepository.bookmarkPreview"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/quranRepository.ts src/data/__tests__/quranRepository.bookmarkPreview.test.ts
git commit -m "feat(bookmarks): add cached getAyahPreview repository helper"
```

---

## Task 5: `BookmarkCategorySheet` component

**Files:**
- Test: `src/components/quran/__tests__/BookmarkCategorySheet.test.tsx` (new)
- Create: `src/components/quran/BookmarkCategorySheet.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/quran/__tests__/BookmarkCategorySheet.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BookmarkCategorySheet } from '../BookmarkCategorySheet';
import type { BookmarkCategory } from '../../../data/types';

function renderSheet(props?: Partial<React.ComponentProps<typeof BookmarkCategorySheet>>) {
  const onCommit = jest.fn();
  const onDismiss = jest.fn();
  const utils = render(
    <BookmarkCategorySheet
      surahName="البقرة"
      ayahNumber={255}
      initialCategories={['reading']}
      onCommit={onCommit}
      onDismiss={onDismiss}
      {...props}
    />
  );
  return { onCommit, onDismiss, ...utils };
}

describe('BookmarkCategorySheet', () => {
  it('renders the reading chip pre-checked when initialCategories includes reading', () => {
    const { getByA11yLabel } = renderSheet({ initialCategories: ['reading'] });
    const reading = getByA11yLabel('chip-reading');
    const recitation = getByA11yLabel('chip-recitation');
    expect(reading.props.accessibilityState).toMatchObject({ selected: true });
    expect(recitation.props.accessibilityState).toMatchObject({ selected: false });
  });

  it('commits a diff with added=[recitation] when user checks recitation and saves', () => {
    const { onCommit, getByA11yLabel, getByText } = renderSheet({ initialCategories: ['reading'] });
    fireEvent.press(getByA11yLabel('chip-recitation'));
    fireEvent.press(getByText('حفظ'));
    expect(onCommit).toHaveBeenCalledWith({
      previous: ['reading'],
      next: ['reading', 'recitation'],
      added: ['recitation'],
      removed: [],
    });
  });

  it('commits an empty next when user unchecks everything via remove-all', () => {
    const { onCommit, getByText } = renderSheet({ initialCategories: ['reading', 'recitation'] });
    fireEvent.press(getByText('حذف الكل'));
    expect(onCommit).toHaveBeenCalledWith({
      previous: ['reading', 'recitation'],
      next: [],
      added: [],
      removed: ['reading', 'recitation'],
    });
  });

  it('does not show remove-all when initialCategories is empty', () => {
    const { queryByText } = renderSheet({ initialCategories: [] });
    expect(queryByText('حذف الكل')).toBeNull();
  });

  it('dismiss without save is a no-op (no onCommit)', () => {
    const { onCommit, onDismiss, getByA11yLabel } = renderSheet({ initialCategories: [] });
    fireEvent.press(getByA11yLabel('sheet-backdrop'));
    expect(onCommit).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

Run: `npm test -- --testPathPattern="BookmarkCategorySheet"`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement the sheet**

Create `src/components/quran/BookmarkCategorySheet.tsx`:

```tsx
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import type { Theme } from '../../constants/theme';
import type { BookmarkCategory } from '../../data/types';

export interface BookmarkCommit {
  previous: BookmarkCategory[];
  next: BookmarkCategory[];
  added: BookmarkCategory[];
  removed: BookmarkCategory[];
}

interface Props {
  surahName: string;
  ayahNumber: number;
  initialCategories: BookmarkCategory[];
  onCommit: (commit: BookmarkCommit) => void;
  onDismiss: () => void;
}

const CATEGORIES: BookmarkCategory[] = ['reading', 'recitation'];

export function BookmarkCategorySheet({
  surahName,
  ayahNumber,
  initialCategories,
  onCommit,
  onDismiss,
}: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const previous = useMemo(() => sortCats(initialCategories), [initialCategories]);
  const [selected, setSelected] = useState<Set<BookmarkCategory>>(new Set(previous));

  const handleToggle = (c: BookmarkCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const buildCommit = (next: BookmarkCategory[]): BookmarkCommit => {
    const prevSet = new Set(previous);
    const nextSet = new Set(next);
    return {
      previous,
      next,
      added: next.filter((c) => !prevSet.has(c)),
      removed: previous.filter((c) => !nextSet.has(c)),
    };
  };

  const handleSave = () => {
    const next = sortCats(Array.from(selected));
    onCommit(buildCommit(next));
  };

  const handleRemoveAll = () => {
    onCommit(buildCommit([]));
  };

  const ayahLabel = isArabic ? toArabicIndic(ayahNumber) : ayahNumber;
  const showRemoveAll = previous.length > 0;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View
        entering={FadeIn.duration(theme.motion.duration.fast)}
        exiting={FadeOut.duration(theme.motion.duration.fast)}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityLabel="sheet-backdrop"
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(theme.motion.duration.base)}
        exiting={SlideOutDown.duration(theme.motion.duration.fast)}
        style={styles.sheet}
        accessibilityRole="alert"
      >
        <Text style={styles.title}>{strings.bookmarks.sheetTitle}</Text>
        <Text style={styles.subtitle}>{`${surahName} · ${strings.searchAyahLabel} ${ayahLabel}`}</Text>

        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => {
            const isOn = selected.has(c);
            const label =
              c === 'reading' ? strings.bookmarks.categoryReading : strings.bookmarks.categoryRecitation;
            return (
              <Pressable
                key={c}
                accessibilityRole="checkbox"
                accessibilityLabel={`chip-${c}`}
                accessibilityState={{ selected: isOn }}
                onPress={() => handleToggle(c)}
                style={[styles.chip, isOn && styles.chipOn]}
              >
                <Text style={[styles.chipLabel, isOn && styles.chipLabelOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          {showRemoveAll && (
            <Pressable
              accessibilityRole="button"
              onPress={handleRemoveAll}
              style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
            >
              <Text style={styles.removeText}>{strings.bookmarks.sheetRemoveAll}</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
          >
            <Text style={styles.saveText}>{strings.bookmarks.sheetSave}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function sortCats(cats: BookmarkCategory[]): BookmarkCategory[] {
  return [...new Set(cats)].sort();
}

function createStyles(theme: Theme, isArabic: boolean) {
  return StyleSheet.create({
    root: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.32)',
    },
    sheet: {
      position: 'absolute',
      left: theme.spacing.md,
      right: theme.spacing.md,
      bottom: 70,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
      backgroundColor: theme.semantic.bgRaised,
      borderRadius: theme.radii.md,
      borderTopWidth: 2,
      borderTopColor: theme.semantic.accent,
      borderRightWidth: 1,
      borderRightColor: theme.semantic.border,
      borderLeftWidth: 1,
      borderLeftColor: theme.semantic.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.semantic.border,
      ...theme.elevation.shadow3,
    },
    title: {
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 16,
      color: theme.semantic.fg,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    subtitle: {
      fontFamily: theme.fonts.arabic,
      fontSize: 13,
      color: theme.semantic.fgMuted,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    chipRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    chip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      backgroundColor: theme.semantic.bg,
      alignItems: 'center',
    },
    chipOn: {
      backgroundColor: theme.semantic.primary,
      borderColor: theme.semantic.primary,
    },
    chipLabel: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      color: theme.semantic.fg,
    },
    chipLabelOn: { color: theme.semantic.fgOnPrimary },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.xs,
    },
    removeBtn: { paddingVertical: 10, paddingHorizontal: 12 },
    removeBtnPressed: { opacity: 0.55 },
    removeText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      color: theme.semantic.danger,
    },
    saveBtn: {
      paddingVertical: 10,
      paddingHorizontal: 22,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.primary,
      marginLeft: 'auto',
    },
    saveBtnPressed: { backgroundColor: theme.semantic.primaryPressed },
    saveText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      color: theme.semantic.fgOnPrimary,
      fontWeight: '600',
    },
  });
}
```

- [ ] **Step 4: Run the test — confirm it passes**

Run: `npm test -- --testPathPattern="BookmarkCategorySheet"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/quran/BookmarkCategorySheet.tsx src/components/quran/__tests__/BookmarkCategorySheet.test.tsx
git commit -m "feat(bookmarks): add BookmarkCategorySheet with diff commit"
```

---

## Task 6: Update `BookmarkSavedSnackbar` for category-aware subtitle

**Files:**
- Modify: `src/components/quran/BookmarkSavedSnackbar.tsx`
- Modify: `src/components/quran/__tests__/BookmarkSavedSnackbar.test.tsx`

- [ ] **Step 1: Update the existing snackbar test**

Read `src/components/quran/__tests__/BookmarkSavedSnackbar.test.tsx` first to see what it currently expects (it predates this change). Replace its contents with:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { BookmarkSavedSnackbar } from '../BookmarkSavedSnackbar';

describe('BookmarkSavedSnackbar', () => {
  const baseProps = {
    surahName: 'البقرة',
    pageNumber: 42,
    juzNumber: 3,
    onUndo: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('renders the reading-only subtitle', () => {
    const { getByText } = render(
      <BookmarkSavedSnackbar {...baseProps} resultingCategories={['reading']} />
    );
    expect(getByText(/للقراءة$/)).toBeTruthy();
  });

  it('renders the recitation-only subtitle', () => {
    const { getByText } = render(
      <BookmarkSavedSnackbar {...baseProps} resultingCategories={['recitation']} />
    );
    expect(getByText(/للتلاوة$/)).toBeTruthy();
  });

  it('renders the both-categories subtitle', () => {
    const { getByText } = render(
      <BookmarkSavedSnackbar {...baseProps} resultingCategories={['reading', 'recitation']} />
    );
    expect(getByText(/للقراءة والتلاوة$/)).toBeTruthy();
  });

  it('renders the removed subtitle when categories is empty', () => {
    const { getByText } = render(
      <BookmarkSavedSnackbar {...baseProps} resultingCategories={[]} />
    );
    expect(getByText(/تم الحذف$/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

Run: `npm test -- --testPathPattern="BookmarkSavedSnackbar"`
Expected: FAIL — current snackbar prop is `surahName/pageNumber/juzNumber` only; `resultingCategories` not accepted.

- [ ] **Step 3: Update the snackbar component**

Replace `src/components/quran/BookmarkSavedSnackbar.tsx` with:

```tsx
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import type { Theme } from '../../constants/theme';
import type { BookmarkCategory } from '../../data/types';

const VISIBLE_MS = 3500;

interface BookmarkSavedSnackbarProps {
  surahName: string;
  pageNumber: number;
  juzNumber: number;
  resultingCategories: BookmarkCategory[];
  onUndo: () => void;
  onDismiss: () => void;
}

export function BookmarkSavedSnackbar({
  surahName,
  pageNumber,
  juzNumber,
  resultingCategories,
  onUndo,
  onDismiss,
}: BookmarkSavedSnackbarProps) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme);

  useEffect(() => {
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [onDismiss, surahName, pageNumber, juzNumber, resultingCategories.join('|')]);

  const pageText = isArabic ? toArabicIndic(pageNumber) : pageNumber;
  const juzText = isArabic ? toArabicIndic(juzNumber) : juzNumber;

  const hasReading = resultingCategories.includes('reading');
  const hasRecitation = resultingCategories.includes('recitation');

  let subtitle: string;
  if (hasReading && hasRecitation) {
    subtitle = strings.bookmark.savedSubtitleBoth(surahName, pageText, juzText);
  } else if (hasReading) {
    subtitle = strings.bookmark.savedSubtitleReading(surahName, pageText, juzText);
  } else if (hasRecitation) {
    subtitle = strings.bookmark.savedSubtitleRecitation(surahName, pageText, juzText);
  } else {
    subtitle = strings.bookmark.savedSubtitleRemoved(surahName, pageText, juzText);
  }

  return (
    <Animated.View
      entering={SlideInDown.duration(theme.motion.duration.base)}
      exiting={SlideOutDown.duration(theme.motion.duration.fast)}
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={styles.bookmarkTile}>
        <MaterialCommunityIcons
          name="bookmark"
          size={24}
          color={theme.semantic.accent}
        />
      </View>

      <View style={styles.textColumn}>
        <Text style={styles.title} numberOfLines={1}>
          {strings.bookmark.savedTitle}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <Pressable
        onPress={onUndo}
        accessibilityRole="button"
        accessibilityLabel={strings.bookmark.undo}
        hitSlop={10}
        style={({ pressed }) => [styles.undoBtn, pressed && styles.undoBtnPressed]}
      >
        <Text style={styles.undoText}>{strings.bookmark.undo}</Text>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: theme.spacing.md,
      right: theme.spacing.md,
      bottom: 70,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.md,
      backgroundColor: theme.semantic.bgRaised,
      borderRadius: 14,
      borderTopWidth: 2,
      borderTopColor: theme.semantic.accent,
      borderRightWidth: 1,
      borderRightColor: theme.semantic.border,
      borderLeftWidth: 1,
      borderLeftColor: theme.semantic.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.semantic.border,
      ...theme.elevation.shadow2,
    },
    bookmarkTile: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: theme.palette.gold[300] + '33',
      borderWidth: 1,
      borderColor: theme.palette.gold[300] + '88',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textColumn: { flex: 1, gap: 3 },
    title: {
      fontFamily: theme.fonts.arabic,
      fontSize: 15,
      fontWeight: '600',
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    subtitle: {
      fontFamily: theme.fonts.arabic,
      fontSize: 12,
      color: theme.semantic.fgMuted,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    undoBtn: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.xs },
    undoBtnPressed: { opacity: 0.55 },
    undoText: { fontFamily: theme.fonts.arabic, fontSize: 14, color: theme.semantic.fgMuted },
  });
}
```

- [ ] **Step 4: Run the test — confirm it passes**

Run: `npm test -- --testPathPattern="BookmarkSavedSnackbar"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/quran/BookmarkSavedSnackbar.tsx src/components/quran/__tests__/BookmarkSavedSnackbar.test.tsx
git commit -m "feat(bookmarks): category-aware snackbar subtitle"
```

---

## Task 7: `ayahActions` `bookmark` case — callback signal

**Files:**
- Modify: `src/actions/ayahActions.ts`

- [ ] **Step 1: Replace the `ayahActions.ts` file**

Replace `src/actions/ayahActions.ts` with:

```ts
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { getAyahTextRange, getJuzAndPageForAyah, getSurahLastAyah } from '../data/quranRepository';
import { useReadingStore } from '../stores/readingStore';
import { recitationEngine } from '../services/recitationEngine';
import type { AyahActionType, AyahSelection } from '../data/types';

export interface AyahActionCallbacks {
  /**
   * Invoked when the user requests a bookmark. The host should open the
   * category-picker sheet. If absent, the bookmark request is a no-op (a
   * warning is logged).
   */
  onRequestBookmark?: (selection: AyahSelection) => void;
}

export async function handleAyahAction(
  action: AyahActionType,
  selection: AyahSelection,
  callbacks?: AyahActionCallbacks
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
      await Share.share({ message: text });
      break;
    }
    case 'bookmark': {
      const { juz, page } = await getJuzAndPageForAyah(startSurah, startAyah);
      useReadingStore.getState().setLastRead(startSurah, startAyah, juz, page);
      if (callbacks?.onRequestBookmark) {
        callbacks.onRequestBookmark(selection);
      } else {
        console.warn('handleAyahAction: bookmark request without onRequestBookmark callback');
      }
      break;
    }
    case 'play': {
      const stopAyah = await getSurahLastAyah(startSurah);
      await recitationEngine.start({
        surah: startSurah,
        startAyah,
        stopAyah,
        trigger: 'popup',
        selectedEndSurah: endSurah,
        selectedEndAyah: endAyah,
      });
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

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: any failures should be limited to later wiring tasks and tests that still use the old store/action contracts.

- [ ] **Step 3: Update the existing action tests for the callback contract**

In `tests/actions/ayahActions.test.ts`, replace the old assertion that `handleAyahAction('bookmark', selection)` directly mutates `bookmarks`. The new behavior is:
- it calls `setLastRead` for the selected ayah, preserving streak/last-read behavior;
- it invokes `callbacks.onRequestBookmark(selection)` when provided;
- it does not mutate `bookmarks` directly.

Use assertions like:

```ts
const onRequestBookmark = jest.fn();
await handleAyahAction('bookmark', mockSelection, { onRequestBookmark });

expect(onRequestBookmark).toHaveBeenCalledWith(mockSelection);
expect(useReadingStore.getState().bookmarks).toEqual([]);
```

- [ ] **Step 4: Run the action tests**

Run: `npm test -- --testPathPattern="ayahActions"`
Expected: PASS.

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: remaining errors are in MushafReader/MushafScreenLayout/SearchScreen where the new category-scoped API and bookmark sheet wiring are not complete yet. Fixed in later tasks.

- [ ] **Step 6: Commit**

```bash
git add src/actions/ayahActions.ts tests/actions/ayahActions.test.ts
git commit -m "feat(bookmarks): route bookmark action through onRequestBookmark callback"
```

---

## Task 8: Wrap root in `GestureHandlerRootView`

**Files:**
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Wrap both `<Stack>` returns with `GestureHandlerRootView`**

In `src/app/_layout.tsx`, add the import near the top:

```ts
import { GestureHandlerRootView } from 'react-native-gesture-handler';
```

Replace the two return blocks (the redirect branch around line 80-92 and the main branch around line 95-106) with:

```tsx
  // Redirect first-time users to onboarding
  if (!hasCompletedOnboarding) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={stackScreenOptions}>
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="surah/[id]" />
          <Stack.Screen name="juz/[id]" />
          <Stack.Screen name="practice" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bookmarks" />
        </Stack>
        <Redirect href="/onboarding" />
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="surah/[id]" />
        <Stack.Screen name="juz/[id]" />
        <Stack.Screen name="practice" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="bookmarks" />
      </Stack>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
```

Note: the bookmarks stack screen is registered here so the typed-routes plugin picks it up.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: route registration may flag the missing `bookmarks.tsx` file. We create it in Task 10. If the typecheck errors block development locally, register the screen at the end of Task 10 instead.

- [ ] **Step 3: Commit**

```bash
git add src/app/_layout.tsx
git commit -m "feat(bookmarks): wrap app in GestureHandlerRootView for Swipeable"
```

---

## Task 9: Home `BrandBar` entry point + test

**Files:**
- Modify: `src/components/home/BrandBar.tsx`
- Create: `tests/components/home/BrandBar.test.tsx`

- [ ] **Step 1: Write the failing BrandBar test**

Create `tests/components/home/BrandBar.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

const pushMock = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (...args: any[]) => pushMock(...args) }),
}));

import { BrandBar } from '../../../src/components/home/BrandBar';

describe('BrandBar', () => {
  beforeEach(() => pushMock.mockReset());

  it('renders a bookmark icon button with the localized label', () => {
    const { getByA11yLabel } = render(<BrandBar />);
    expect(getByA11yLabel('افتح الإشارات المرجعية')).toBeTruthy();
  });

  it('navigates to /bookmarks when the icon is pressed', () => {
    const { getByA11yLabel } = render(<BrandBar />);
    fireEvent.press(getByA11yLabel('افتح الإشارات المرجعية'));
    expect(pushMock).toHaveBeenCalledWith('/bookmarks');
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

Run: `npm test -- --testPathPattern="BrandBar"`
Expected: FAIL — bookmark icon does not exist yet.

- [ ] **Step 3: Add the trailing icon to `BrandBar`**

Replace `src/components/home/BrandBar.tsx` with:

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { LogoGlyph } from '../brand/LogoGlyph';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';

/**
 * Top-of-Home brand bar: rosette glyph + localized wordmark and a trailing
 * action slot. Currently hosts the bookmarks entry icon.
 */
export function BrandBar() {
  const theme = useTheme();
  const strings = useStrings();
  const router = useRouter();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <LogoGlyph
          size={36}
          bg={theme.semantic.primary}
          gold={theme.semantic.accentSoft}
          goldSoft={theme.semantic.accentSoft}
        />
        <View style={styles.wordmarkText}>
          <Text style={styles.brandTitle}>{strings.appTitle}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.bookmarks.openLabel}
        onPress={() => router.push('/bookmarks')}
        hitSlop={6}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
      >
        <Svg width={18} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            stroke={theme.semantic.accent}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    row: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    brand: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    wordmarkText: {
      alignItems: isArabic ? 'flex-end' : 'flex-start',
      height: 36,
      justifyContent: 'center',
    },
    brandTitle: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 20 : 18,
      color: theme.semantic.fg,
      lineHeight: 36,
      textAlign: isArabic ? 'right' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      fontWeight: isArabic ? 'normal' : '700',
      includeFontPadding: false,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: theme.radii.md,
      backgroundColor: theme.semantic.bgRaised,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPressed: { opacity: 0.7 },
  });
}
```

- [ ] **Step 4: Run the BrandBar test — confirm it passes**

Run: `npm test -- --testPathPattern="BrandBar"`
Expected: PASS.

- [ ] **Step 5: Run the existing English-locale layout test to confirm no regression**

Run: `npm test -- --testPathPattern="EnglishLocaleLayout"`
Expected: PASS. If the test asserts the row had `justifyContent: 'flex-start'`, update it to the new `'space-between'` value in the same commit.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/BrandBar.tsx tests/components/home/BrandBar.test.tsx
git commit -m "feat(bookmarks): add Home brand-bar bookmark icon entry"
```

---

## Task 10: BookmarksScreen + BookmarkRow + `/bookmarks` route

**Files:**
- Create: `src/components/bookmarks/BookmarkRow.tsx`
- Create: `src/components/bookmarks/BookmarksScreen.tsx`
- Create: `src/components/bookmarks/__tests__/BookmarksScreen.test.tsx`
- Create: `src/app/bookmarks.tsx`

- [ ] **Step 1: Write the failing BookmarksScreen test**

Create `src/components/bookmarks/__tests__/BookmarksScreen.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BookmarksScreen } from '../BookmarksScreen';
import { useReadingStore } from '../../../stores/readingStore';

const pushMock = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (...args: any[]) => pushMock(...args), back: jest.fn() }),
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('../../../data/quranRepository', () => ({
  getAyahPreview: jest.fn(async (s: number, a: number) => `preview-${s}-${a}`),
  getJuzAndPageForAyah: jest.fn(async () => ({ juz: 1, page: 1 })),
  getSurahByNumber: jest.fn(async (n: number) => ({
    number: n,
    nameArabic: `سورة-${n}`,
    nameEnglish: `Surah-${n}`,
    ayahCount: 7,
    revelationType: 'Makki',
    revelationOrder: n,
    juzStart: 1,
  })),
}));

// Mock @shopify/flash-list to render synchronously.
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FlashList: ({ data = [], renderItem, keyExtractor }: any) => (
      <View>
        {data.map((item: any, index: number) => (
          <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
            {renderItem({ item, index })}
          </React.Fragment>
        ))}
      </View>
    ),
  };
});

// Isolate from PillTabs internals — render stable a11y-labeled buttons.
jest.mock('../../home/PillTabs', () => {
  const React = require('react');
  const { View, Pressable, Text } = require('react-native');
  return {
    PillTabs: ({ tabs, active, onChange }: any) => (
      <View>
        {tabs.map((t: any) => (
          <Pressable
            key={t.id}
            accessibilityLabel={`tab-${t.id}`}
            accessibilityState={{ selected: t.id === active }}
            onPress={() => onChange(t.id)}
          >
            <Text>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    ),
  };
});

// Swipeable renders either action side inline so tests can press the delete.
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View, Pressable } = require('react-native');
  return {
    Swipeable: ({ children, renderLeftActions, renderRightActions }: any) => (
      <View>
        {children}
        {renderLeftActions ? renderLeftActions() : null}
        {renderRightActions ? renderRightActions() : null}
      </View>
    ),
    RectButton: ({ children, onPress, accessibilityLabel, style }: any) => (
      <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} style={style}>
        {children}
      </Pressable>
    ),
  };
});

function seedBookmarks(items: Array<{ s: number; a: number; c: 'reading' | 'recitation' }>) {
  useReadingStore.setState({
    bookmarks: items.map((i, idx) => ({
      surahNumber: i.s,
      ayahNumber: i.a,
      category: i.c,
      createdAt: 1_700_000_000_000 + idx,
    })),
  } as any);
}

describe('BookmarksScreen', () => {
  beforeEach(() => {
    pushMock.mockReset();
    useReadingStore.setState({ bookmarks: [] } as any);
  });

  it('shows empty state when no bookmarks exist for the active tab', async () => {
    const { getByText } = render(<BookmarksScreen />);
    expect(getByText('لم تحفظ آيات للقراءة بعد')).toBeTruthy();
  });

  it('renders bookmarks for the reading tab and ignores recitation entries', async () => {
    seedBookmarks([
      { s: 2, a: 255, c: 'reading' },
      { s: 36, a: 1, c: 'recitation' },
    ]);
    const { findByText, queryByText } = render(<BookmarksScreen />);
    expect(await findByText(/سورة-2/)).toBeTruthy();
    expect(queryByText(/سورة-36/)).toBeNull();
  });

  it('switches to the recitation tab and renders its entries', async () => {
    seedBookmarks([
      { s: 2, a: 255, c: 'reading' },
      { s: 36, a: 1, c: 'recitation' },
    ]);
    const { getByA11yLabel, findByText } = render(<BookmarksScreen />);
    fireEvent.press(getByA11yLabel('tab-recitation'));
    expect(await findByText(/سورة-36/)).toBeTruthy();
  });

  it('navigates to /surah/[id]?page=N when a row is pressed', async () => {
    seedBookmarks([{ s: 2, a: 255, c: 'reading' }]);
    const { findByA11yLabel } = render(<BookmarksScreen />);
    const row = await findByA11yLabel('bookmark-row-2-255');
    fireEvent.press(row);
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/surah/[id]' })
      );
    });
  });

  it('swipe-delete removes only the current-tab category', async () => {
    seedBookmarks([
      { s: 2, a: 255, c: 'reading' },
      { s: 2, a: 255, c: 'recitation' },
    ]);
    const { findByA11yLabel } = render(<BookmarksScreen />);
    await findByA11yLabel('bookmark-row-2-255');
    fireEvent.press(await findByA11yLabel('delete-2-255'));
    await waitFor(() => {
      const bms = useReadingStore.getState().bookmarks;
      expect(bms).toHaveLength(1);
      expect(bms[0].category).toBe('recitation');
    });
  });
});
```

- [ ] **Step 2: Run — confirm it fails**

Run: `npm test -- --testPathPattern="BookmarksScreen"`
Expected: FAIL — components missing.

- [ ] **Step 3: Create `BookmarkRow.tsx`**

```tsx
// src/components/bookmarks/BookmarkRow.tsx
import React, { useEffect, useRef, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import { getAyahPreview } from '../../data/quranRepository';
import type { BookmarkCategory } from '../../data/types';

interface Props {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  pageNumber: number;
  category: BookmarkCategory;
  onPress: () => void;
  onDelete: () => void;
}

export function BookmarkRow({
  surahNumber,
  ayahNumber,
  surahName,
  pageNumber,
  onPress,
  onDelete,
}: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const [preview, setPreview] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void getAyahPreview(surahNumber, ayahNumber).then((text) => {
      if (mounted.current) setPreview(text);
    });
    return () => {
      mounted.current = false;
    };
  }, [surahNumber, ayahNumber]);

  const ayahLabel = isArabic ? toArabicIndic(ayahNumber) : ayahNumber;
  const pageLabel = isArabic ? toArabicIndic(pageNumber) : pageNumber;

  const renderDeleteAction = () => (
    <RectButton
      accessibilityLabel={`delete-${surahNumber}-${ayahNumber}`}
      onPress={onDelete}
      style={styles.deleteAction}
    >
      <Text style={styles.deleteText}>{strings.bookmarks.deleteAction}</Text>
    </RectButton>
  );

  const actionProps = I18nManager.isRTL
    ? { renderLeftActions: renderDeleteAction, overshootLeft: false }
    : { renderRightActions: renderDeleteAction, overshootRight: false };

  return (
    <Swipeable {...actionProps}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`bookmark-row-${surahNumber}-${ayahNumber}`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={1}>
            {`${surahName} · ${strings.searchAyahLabel} ${ayahLabel}`}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {`${strings.searchPageShort} ${pageLabel}`}
          </Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </Pressable>
    </Swipeable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    row: {
      backgroundColor: theme.semantic.bgRaised,
      paddingVertical: theme.spacing.md - 2,
      paddingHorizontal: theme.gutter.row,
      borderBottomWidth: 1,
      borderBottomColor: theme.semantic.border,
      gap: 6,
    },
    rowPressed: { backgroundColor: theme.semantic.bgSunken },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: {
      flex: 1,
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 15,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    meta: {
      fontFamily: theme.fonts.arabic,
      fontSize: 12,
      color: theme.semantic.fgMuted,
    },
    preview: {
      fontFamily: theme.fonts.quran,
      fontSize: 16,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    deleteAction: {
      backgroundColor: theme.semantic.danger,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    deleteText: {
      color: theme.semantic.fgOnPrimary,
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
```

- [ ] **Step 4: Create `BookmarksScreen.tsx`**

```tsx
// src/components/bookmarks/BookmarksScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useReadingStore } from '../../stores/readingStore';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { PillTabs } from '../home/PillTabs';
import { BookmarkRow } from './BookmarkRow';
import { getJuzAndPageForAyah, getSurahByNumber } from '../../data/quranRepository';
import { toArabicIndic } from '../../utils/arabic';
import type { Bookmark, BookmarkCategory } from '../../data/types';

interface RowData extends Bookmark {
  surahName: string;
  pageNumber: number;
}

export function BookmarksScreen() {
  const theme = useTheme();
  const strings = useStrings();
  const router = useRouter();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const bookmarks = useReadingStore((s) => s.bookmarks);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);

  const [activeTab, setActiveTab] = useState<BookmarkCategory>('reading');
  const [hydrated, setHydrated] = useState<
    Record<string, { nameArabic: string; nameEnglish: string; page: number }>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = bookmarks.filter((b) => !hydrated[`${b.surahNumber}:${b.ayahNumber}`]);
      if (missing.length === 0) return;

      const additions: Record<string, { nameArabic: string; nameEnglish: string; page: number }> = {};
      for (const b of bookmarks) {
        const key = `${b.surahNumber}:${b.ayahNumber}`;
        if (hydrated[key] || additions[key]) continue;
        try {
          const [{ page }, surah] = await Promise.all([
            getJuzAndPageForAyah(b.surahNumber, b.ayahNumber),
            getSurahByNumber(b.surahNumber),
          ]);
          if (cancelled) return;
          additions[key] = {
            nameArabic: surah?.nameArabic ?? '',
            nameEnglish: surah?.nameEnglish ?? '',
            page,
          };
        } catch {
          /* non-critical */
        }
      }
      if (!cancelled && Object.keys(additions).length > 0) {
        setHydrated((prev) => ({ ...prev, ...additions }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookmarks, hydrated]);

  const filtered: RowData[] = useMemo(() => {
    return bookmarks
      .filter((b) => b.category === activeTab)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((b) => {
        const key = `${b.surahNumber}:${b.ayahNumber}`;
        const h = hydrated[key];
        return {
          ...b,
          surahName: h ? (isArabic ? h.nameArabic : h.nameEnglish) : String(b.surahNumber),
          pageNumber: h?.page ?? 1,
        };
      });
  }, [bookmarks, activeTab, hydrated, isArabic]);

  const countReading = bookmarks.filter((b) => b.category === 'reading').length;
  const countRecitation = bookmarks.filter((b) => b.category === 'recitation').length;
  const fmtCount = (n: number) => (isArabic ? toArabicIndic(n) : String(n));

  const tabs = useMemo(
    () =>
      [
        { id: 'reading' as const, label: `${strings.bookmarks.tabReading} ${fmtCount(countReading)}` },
        {
          id: 'recitation' as const,
          label: `${strings.bookmarks.tabRecitation} ${fmtCount(countRecitation)}`,
        },
      ] as const,
    [strings, countReading, countRecitation, isArabic]
  );

  const emptyCopy =
    activeTab === 'reading' ? strings.bookmarks.emptyReading : strings.bookmarks.emptyRecitation;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.back}
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="m15 6-6 6 6 6"
              stroke={theme.semantic.fg}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text style={styles.title}>{strings.bookmarks.screenTitle}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabsWrap}>
        <PillTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyCopy}</Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(r) => `${r.surahNumber}-${r.ayahNumber}-${r.category}`}
          renderItem={({ item }) => (
            <BookmarkRow
              surahNumber={item.surahNumber}
              ayahNumber={item.ayahNumber}
              surahName={item.surahName}
              pageNumber={item.pageNumber}
              category={item.category}
              onPress={() =>
                router.push({
                  pathname: '/surah/[id]',
                  params: { id: String(item.surahNumber), page: String(item.pageNumber) },
                })
              }
              onDelete={() => removeBookmark(item.surahNumber, item.ayahNumber, item.category)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
      direction: isArabic ? 'rtl' : 'ltr',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 18,
      color: theme.semantic.fg,
      textAlign: 'center',
    },
    tabsWrap: {
      paddingHorizontal: theme.gutter.screen,
      paddingBottom: theme.spacing.sm,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.gutter.screen,
    },
    emptyText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
    },
  });
}
```

- [ ] **Step 5: Create the route entry**

Create `src/app/bookmarks.tsx`:

```tsx
import React from 'react';
import { BookmarksScreen } from '../components/bookmarks/BookmarksScreen';

export default function BookmarksRoute() {
  return <BookmarksScreen />;
}
```

- [ ] **Step 6: Run the BookmarksScreen test — confirm it passes**

Run: `npm test -- --testPathPattern="BookmarksScreen"`
Expected: PASS. The test file already provides the `react-native-gesture-handler` mock (Step 1 above) that renders the swipe delete action inline.

- [ ] **Step 7: Commit**

```bash
git add src/components/bookmarks src/app/bookmarks.tsx
git commit -m "feat(bookmarks): add BookmarksScreen with pill tabs and swipe delete"
```

---

## Task 11: Wire `MushafScreenLayout` to host the sheet and snackbar

**Files:**
- Test: `src/components/quran/__tests__/MushafScreenLayout.bookmarkUndo.test.tsx` (new)
- Modify: `src/components/quran/MushafScreenLayout.tsx`
- Modify: `src/components/quran/MushafReader.tsx`

- [ ] **Step 1: Add focused undo-restore coverage**

Create `src/components/quran/__tests__/MushafScreenLayout.bookmarkUndo.test.tsx`. Mock `MushafReader` so the test can trigger `onAyahAction('bookmark', selection)` without WebView/PagerView, mock `BookmarkCategorySheet` so it can emit specific `BookmarkCommit` payloads, and mock `BookmarkSavedSnackbar` with a pressable Undo button.

Cover at least these exact restore cases:
- Reading -> Recitation, then Undo restores only Reading.
- Both -> Reading, then Undo restores Reading and Recitation.
- Both -> Removed, then Undo restores Reading and Recitation.

The assertions should inspect `useReadingStore.getState().bookmarks`, not just whether the snackbar rendered. This protects the real undo algorithm in `MushafScreenLayout`, not merely the sheet diff helper.

- [ ] **Step 2: Run the undo test — confirm it fails before the layout is wired**

Run: `npm test -- --testPathPattern="MushafScreenLayout.bookmarkUndo"`
Expected: FAIL — `MushafScreenLayout` does not host the sheet/snackbar yet.

- [ ] **Step 3: Update `MushafScreenLayout.tsx` to host the sheet + snackbar**

Replace `src/components/quran/MushafScreenLayout.tsx` with:

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getJuzAndPageForAyah,
  getSurahByNumber,
  getSurahForPage,
} from '../../data/quranRepository';
import { handleAyahAction } from '../../actions/ayahActions';
import { MushafReader } from './MushafReader';
import { ReaderHeader } from './ReaderHeader';
import { BookmarkCategorySheet, type BookmarkCommit } from './BookmarkCategorySheet';
import { BookmarkSavedSnackbar } from './BookmarkSavedSnackbar';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import { useReadingStore } from '../../stores/readingStore';
import type {
  AyahActionType,
  AyahSelection,
  BookmarkCategory,
} from '../../data/types';

interface Props {
  loadInitialPage: () => Promise<{ page: number; surahName: string }>;
  errorMessage: string;
}

const PAGES_PER_JUZ = 604 / 30;
function juzForPage(page: number): number {
  return Math.max(1, Math.min(30, Math.ceil(page / PAGES_PER_JUZ)));
}

interface SnackbarInfo {
  surahName: string;
  page: number;
  juz: number;
  resulting: BookmarkCategory[];
  previous: BookmarkCategory[];
  surahNumber: number;
  ayahNumber: number;
}

export function MushafScreenLayout({ loadInitialPage, errorMessage }: Props) {
  const { colors, nightReadingEnabled } = useReaderColors();
  const styles = createStyles(colors);
  const [surahName, setSurahName] = useState('');
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [initialPage, setInitialPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sheet + snackbar state
  const [sheetSelection, setSheetSelection] = useState<AyahSelection | null>(null);
  const [sheetSurahName, setSheetSurahName] = useState('');
  const [snackbar, setSnackbar] = useState<SnackbarInfo | null>(null);

  const addBookmark = useReadingStore((s) => s.addBookmark);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);
  const getBookmarkCategories = useReadingStore((s) => s.getBookmarkCategories);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadInitialPage();
      setSurahName(result.surahName);
      setInitialPage(result.page);
      setCurrentPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadInitialPage, errorMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openSheet = useCallback(async (selection: AyahSelection) => {
    setSheetSelection(selection);
    try {
      const s = await getSurahByNumber(selection.startSurah);
      setSheetSurahName(s?.nameArabic ?? '');
    } catch {
      setSheetSurahName('');
    }
  }, []);

  const handleAction = useCallback(
    (action: AyahActionType, selection: AyahSelection) => {
      handleAyahAction(action, selection, {
        onRequestBookmark: (sel) => {
          void openSheet(sel);
        },
      });
    },
    [openSheet]
  );

  const handlePageBookmarkRequest = useCallback(
    (selection: AyahSelection) => {
      void openSheet(selection);
    },
    [openSheet]
  );

  const handleSheetCommit = useCallback(
    async (commit: BookmarkCommit) => {
      if (!sheetSelection) return;
      const { startSurah, startAyah } = sheetSelection;
      commit.added.forEach((c) => addBookmark(startSurah, startAyah, c));
      commit.removed.forEach((c) => removeBookmark(startSurah, startAyah, c));
      try {
        const { juz, page } = await getJuzAndPageForAyah(startSurah, startAyah);
        setSnackbar({
          surahNumber: startSurah,
          ayahNumber: startAyah,
          surahName: sheetSurahName,
          page,
          juz,
          resulting: commit.next,
          previous: commit.previous,
        });
      } catch {
        /* non-critical */
      }
      setSheetSelection(null);
    },
    [sheetSelection, sheetSurahName, addBookmark, removeBookmark]
  );

  const handleSheetDismiss = useCallback(() => setSheetSelection(null), []);

  const handleUndoSnackbar = useCallback(() => {
    if (!snackbar) return;
    // Restore previous category set exactly: remove anything currently set
    // that wasn't in `previous`, and add anything in `previous` that is missing.
    const current = getBookmarkCategories(snackbar.surahNumber, snackbar.ayahNumber);
    const prevSet = new Set(snackbar.previous);
    const curSet = new Set(current);
    current.forEach((c) => {
      if (!prevSet.has(c)) removeBookmark(snackbar.surahNumber, snackbar.ayahNumber, c);
    });
    snackbar.previous.forEach((c) => {
      if (!curSet.has(c)) addBookmark(snackbar.surahNumber, snackbar.ayahNumber, c);
    });
    setSnackbar(null);
  }, [snackbar, addBookmark, removeBookmark, getBookmarkCategories]);

  const handleDismissSnackbar = useCallback(() => setSnackbar(null), []);

  const handlePageChange = useCallback(async (pageNumber: number) => {
    setCurrentPage(pageNumber);
    try {
      const surah = await getSurahForPage(pageNumber);
      if (surah) {
        setSurahName((prev) => (prev === surah.nameArabic ? prev : surah.nameArabic));
      }
    } catch {
      /* non-critical */
    }
  }, []);

  const initialCategories =
    sheetSelection !== null
      ? getBookmarkCategories(sheetSelection.startSurah, sheetSelection.startAyah)
      : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {nightReadingEnabled && <StatusBar style="light" />}
      <ReaderHeader
        surahName={surahName}
        juzNumber={juzForPage(currentPage ?? 1)}
        pageNumber={currentPage ?? 1}
      />
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : initialPage !== null ? (
        <View style={styles.body}>
          <MushafReader
            initialPage={initialPage}
            onPageChange={handlePageChange}
            onAyahAction={handleAction}
            onPageBookmarkRequest={handlePageBookmarkRequest}
          />
          {sheetSelection && (
            <BookmarkCategorySheet
              surahName={sheetSurahName}
              ayahNumber={sheetSelection.startAyah}
              initialCategories={initialCategories}
              onCommit={handleSheetCommit}
              onDismiss={handleSheetDismiss}
            />
          )}
          {snackbar && (
            <BookmarkSavedSnackbar
              key={`${snackbar.surahNumber}-${snackbar.ayahNumber}-${snackbar.resulting.join('|')}`}
              surahName={snackbar.surahName}
              pageNumber={snackbar.page}
              juzNumber={snackbar.juz}
              resultingCategories={snackbar.resulting}
              onUndo={handleUndoSnackbar}
              onDismiss={handleDismissSnackbar}
            />
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(colors: ReaderColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, direction: 'rtl' },
    body: { flex: 1 },
  });
}
```

- [ ] **Step 4: Slim `MushafReader.tsx` — remove inline bookmark mutation, snackbar, and add the new prop**

Replace `src/components/quran/MushafReader.tsx` with:

```tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { MushafPage } from './MushafPage';
import { AyahPopup } from './AyahPopup';
import { MiniPlayerBar } from './MiniPlayerBar';
import { MushafBottomToolbar } from './MushafBottomToolbar';
import {
  getJuzAndPageForAyah,
  getPageForAyah,
  getSurahByNumber,
  getSurahLastAyah,
  getTopAyahForPage,
} from '../../data/quranRepository';
import { recitationEngine } from '../../services/recitationEngine';
import { useReadingStore } from '../../stores/readingStore';
import { useRecitationStore } from '../../stores/recitationStore';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import type { AyahSelection, AyahActionType } from '../../data/types';

const TOTAL_PAGES = 604;
const PAGE_RENDER_BUFFER = 2;

interface MushafReaderProps {
  initialPage: number;
  onPageChange?: (pageNumber: number) => void;
  onAyahAction?: (action: AyahActionType, selection: AyahSelection) => void;
  /** Called when the page-level bookmark icon is pressed. Host opens the sheet. */
  onPageBookmarkRequest?: (selection: AyahSelection) => void;
}

export async function startToolbarRecitationFromPage(pageNumber: number): Promise<void> {
  const playbackState = useRecitationStore.getState().state;
  if (playbackState === 'playing' || playbackState === 'loading') return;
  if (playbackState === 'paused') {
    await recitationEngine.resume();
    return;
  }
  const topAyah = await getTopAyahForPage(pageNumber);
  const stopAyah = await getSurahLastAyah(topAyah.surahNumber);
  await recitationEngine.start({
    surah: topAyah.surahNumber,
    startAyah: topAyah.ayahNumber,
    stopAyah,
    trigger: 'toolbar',
  });
}

interface PageTopAyahInfo {
  surahNumber: number;
  ayahNumber: number;
  juz: number;
  page: number;
  surahName: string;
}

export function MushafReader({
  initialPage,
  onPageChange,
  onAyahAction,
  onPageBookmarkRequest,
}: MushafReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const currentPageRef = useRef(initialPage);
  const pagerRef = useRef<PagerView>(null);
  const { colors } = useReaderColors();
  const styles = createStyles(colors);
  const setLastRead = useReadingStore((s) => s.setLastRead);
  const bookmarks = useReadingStore((s) => s.bookmarks);
  const playbackRange = useRecitationStore((s) => s.range);
  const playbackAyah = useRecitationStore((s) => s.currentAyah);
  const playbackState = useRecitationStore((s) => s.state);

  const [selection, setSelection] = useState<AyahSelection | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const clearSelectionRef = useRef<(() => void) | null>(null);

  const [pageTopAyah, setPageTopAyah] = useState<PageTopAyahInfo | null>(null);

  const applyPageChange = useCallback(
    (pageNumber: number) => {
      currentPageRef.current = pageNumber;
      setCurrentPage(pageNumber);
      setPageTopAyah(null);
      (async () => {
        try {
          const topAyah = await getTopAyahForPage(pageNumber);
          const [{ juz }, surah] = await Promise.all([
            getJuzAndPageForAyah(topAyah.surahNumber, topAyah.ayahNumber),
            getSurahByNumber(topAyah.surahNumber),
          ]);
          if (currentPageRef.current !== pageNumber) return;
          setLastRead(topAyah.surahNumber, topAyah.ayahNumber, juz, pageNumber);
          setPageTopAyah({
            surahNumber: topAyah.surahNumber,
            ayahNumber: topAyah.ayahNumber,
            juz,
            page: pageNumber,
            surahName: surah?.nameArabic ?? '',
          });
        } catch {
          /* non-critical */
        }
      })();
      onPageChange?.(pageNumber);
      setSelection(null);
      setShowActions(false);
      clearSelectionRef.current?.();
    },
    [setLastRead, onPageChange]
  );

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const pageNumber = event.nativeEvent.position + 1;
      applyPageChange(pageNumber);
    },
    [applyPageChange]
  );

  useEffect(() => {
    applyPageChange(initialPage);
  }, [applyPageChange, initialPage]);

  useEffect(() => {
    let cancelled = false;
    const playbackSurah = playbackRange?.surah;
    if (!playbackSurah || playbackAyah === null || playbackState === 'idle' || playbackState === 'error') {
      return undefined;
    }
    getPageForAyah(playbackSurah, playbackAyah)
      .then((pageNumber) => {
        if (cancelled || pageNumber === currentPageRef.current) return;
        pagerRef.current?.setPage(pageNumber - 1);
        applyPageChange(pageNumber);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [playbackRange?.surah, playbackAyah, playbackState, applyPageChange]);

  const handleSelectionEvent = useCallback((data: any) => {
    if (data.type === 'select') {
      setSelection({
        startSurah: data.startSurah,
        startAyah: data.startAyah,
        endSurah: data.endSurah,
        endAyah: data.endAyah,
      });
      setShowActions(Boolean(data.openMenu));
      if (data.openMenu) {
        setPopupPos({ x: data.x, y: data.y });
      }
    } else if (data.type === 'deselect') {
      setSelection(null);
      setShowActions(false);
    }
  }, []);

  const handleAction = useCallback(
    (action: AyahActionType, sel: AyahSelection) => {
      onAyahAction?.(action, sel);
      setSelection(null);
      setShowActions(false);
      clearSelectionRef.current?.();
    },
    [onAyahAction]
  );

  const handleDismiss = useCallback(() => {
    setSelection(null);
    setShowActions(false);
    clearSelectionRef.current?.();
  }, []);

  const handleToolbarPlay = useCallback(() => {
    void startToolbarRecitationFromPage(currentPage);
  }, [currentPage]);

  const bookmarkActive = useMemo(() => {
    if (!pageTopAyah) return false;
    return bookmarks.some(
      (b) => b.surahNumber === pageTopAyah.surahNumber && b.ayahNumber === pageTopAyah.ayahNumber
    );
  }, [bookmarks, pageTopAyah]);

  const handleBookmarkPress = useCallback(() => {
    if (!pageTopAyah || !onPageBookmarkRequest) return;
    onPageBookmarkRequest({
      startSurah: pageTopAyah.surahNumber,
      startAyah: pageTopAyah.ayahNumber,
      endSurah: pageTopAyah.surahNumber,
      endAyah: pageTopAyah.ayahNumber,
    });
  }, [pageTopAyah, onPageBookmarkRequest]);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage - 1}
        offscreenPageLimit={1}
        layoutDirection="rtl"
        onPageSelected={handlePageSelected}
      >
        {Array.from({ length: TOTAL_PAGES }, (_, index) => {
          const pageNumber = index + 1;
          const isNearby = Math.abs(pageNumber - currentPage) <= PAGE_RENDER_BUFFER;
          return (
            <View key={`page-${pageNumber}`} style={styles.pageContainer}>
              {isNearby ? (
                <MushafPage
                  pageNumber={pageNumber}
                  isActive={pageNumber === currentPage}
                  onSelectionEvent={pageNumber === currentPage ? handleSelectionEvent : undefined}
                  clearSelectionRef={pageNumber === currentPage ? clearSelectionRef : undefined}
                />
              ) : (
                <View style={styles.placeholder}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              )}
            </View>
          );
        })}
      </PagerView>

      {selection && showActions && (
        <AyahPopup
          selection={selection}
          x={popupPos.x}
          y={popupPos.y}
          onAction={handleAction}
          onDismiss={handleDismiss}
        />
      )}

      <MiniPlayerBar />
      <MushafBottomToolbar
        onPlayPress={handleToolbarPlay}
        bookmarkActive={bookmarkActive}
        onBookmarkPress={handleBookmarkPress}
      />
    </View>
  );
}

function createStyles(colors: ReaderColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    pager: { flex: 1 },
    pageContainer: { flex: 1, overflow: 'hidden' },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  });
}
```

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS for reader-related files. SearchScreen still needs behavioral rewiring in Task 12, but the third `handleAyahAction` argument is optional so TypeScript may not flag it.

- [ ] **Step 6: Run the undo and surah-resume integration tests**

Run: `npm test -- --testPathPattern="MushafScreenLayout.bookmarkUndo|surahResume"`
Expected: PASS. The surah-resume test mocks `MushafScreenLayout`, so internal restructure should not affect it.

- [ ] **Step 7: Run the bottom-toolbar test**

Run: `npm test -- --testPathPattern="MushafBottomToolbar"`
Expected: PASS. The toolbar props are unchanged.

- [ ] **Step 8: Run the MushafReader toolbar test**

Run: `npm test -- --testPathPattern="MushafReader.toolbar"`
Expected: PASS. The existing test mocks `MushafBottomToolbar` and `BookmarkSavedSnackbar`, so it never touches the bookmark code path; removing the snackbar import from `MushafReader.tsx` leaves the `jest.mock('../BookmarkSavedSnackbar', ...)` line unused but harmless. If the test fails because the snackbar mock is referenced as "unused" (it won't — Jest accepts unused mocks), remove that mock line.

- [ ] **Step 9: Commit**

```bash
git add src/components/quran/MushafScreenLayout.tsx src/components/quran/MushafReader.tsx src/components/quran/__tests__/MushafScreenLayout.bookmarkUndo.test.tsx
git commit -m "feat(bookmarks): host category sheet + snackbar in MushafScreenLayout"
```

---

## Task 12: Wire `SearchScreen` to host the sheet

**Files:**
- Modify: `src/components/search/SearchScreen.tsx`
- Modify: `src/components/search/__tests__/SearchScreen.actions.test.tsx`

- [ ] **Step 1: Update the `handleAyahAction` mock to invoke the bookmark callback**

In `src/components/search/__tests__/SearchScreen.actions.test.tsx`, replace lines 10 and 21-23 with this mock that simulates the real callback path:

```ts
const mockHandleAyahAction = jest.fn<
  Promise<void>,
  [string, unknown, { onRequestBookmark?: (sel: unknown) => void } | undefined]
>((action, selection, callbacks) => {
  if (action === 'bookmark' && callbacks?.onRequestBookmark) {
    callbacks.onRequestBookmark(selection);
  }
  return Promise.resolve();
});
```

And update the mock setup at lines 21-23:

```ts
jest.mock('../../../actions/ayahActions', () => ({
  handleAyahAction: (action: string, selection: unknown, callbacks: unknown) =>
    mockHandleAyahAction(action, selection, callbacks as any),
}));
```

- [ ] **Step 2: Add the store mock and update the bookmark assertion**

Add a `useReadingStore` mock near the other top-of-file jest mocks (after the `react-native-mmkv` block):

```ts
const mockAddBookmark = jest.fn();
const mockRemoveBookmark = jest.fn();
const mockGetBookmarkCategories = jest.fn<unknown[], [number, number]>(() => []);

jest.mock('../../../stores/readingStore', () => ({
  useReadingStore: Object.assign(
    (selector: (s: unknown) => unknown) =>
      selector({
        bookmarks: [],
        addBookmark: mockAddBookmark,
        removeBookmark: mockRemoveBookmark,
        getBookmarkCategories: mockGetBookmarkCategories,
      }),
    {
      getState: () => ({
        bookmarks: [],
        addBookmark: mockAddBookmark,
        removeBookmark: mockRemoveBookmark,
        getBookmarkCategories: mockGetBookmarkCategories,
      }),
    },
  ),
}));
```

Also extend `quranRepository` mock at lines 79-91 to include `getSurahByNumber`:

```ts
jest.mock('../../../data/quranRepository', () => ({
  searchAyahs: jest.fn(() =>
    Promise.resolve([
      {
        surahNumber: 2,
        ayahNumber: 53,
        textUthmani: 'وَإِذْ ءَاتَيْنَا مُوسَى ٱلْكِتَٰبَ وَٱلْفُرْقَانَ',
        juzNumber: 1,
        pageNumber: 8,
      },
    ]),
  ),
  getSurahByNumber: jest.fn(async (n: number) => ({
    number: n,
    nameArabic: 'البقرة',
    nameEnglish: 'Al-Baqarah',
    ayahCount: 286,
    revelationType: 'Madani',
    revelationOrder: 87,
    juzStart: 1,
  })),
  getAyahPreview: jest.fn(async () => 'preview'),
}));
```

Extend the `beforeEach` (around line 98-106) to reset the new mocks:

```ts
beforeEach(() => {
  mockHandleAyahAction.mockClear();
  mockRouterPush.mockClear();
  mockEngineStart.mockClear();
  mockEngineStop.mockClear();
  mockEnginePause.mockClear();
  mockEngineResume.mockClear();
  mockAddBookmark.mockReset();
  mockRemoveBookmark.mockReset();
  mockGetBookmarkCategories.mockReset();
  mockGetBookmarkCategories.mockReturnValue([]);
  mockEngineState = { state: 'idle', range: null };
});
```

Replace the existing copy+bookmark assertion test (`'routes copy and bookmark to handleAyahAction with the result selection'`, lines 157-177) with two tests:

```tsx
it('routes copy to handleAyahAction with the result selection', async () => {
  const { findByLabelText } = render(<SearchScreen initialQuery="الفرقان" />);
  const copyButton = await findByLabelText(/نسخ الآية|Copy verse/i);
  fireEvent.press(copyButton);

  const expectedSelection = {
    startSurah: 2,
    startAyah: 53,
    endSurah: 2,
    endAyah: 53,
  };
  await waitFor(() => {
    expect(mockHandleAyahAction).toHaveBeenCalledWith('copy', expectedSelection, undefined);
  });
});

it('opens the category sheet when the bookmark action is pressed', async () => {
  const { findByLabelText, findByText } = render(<SearchScreen initialQuery="الفرقان" />);
  const bookmarkButton = await findByLabelText(/حفظ الآية|Bookmark verse/i);
  fireEvent.press(bookmarkButton);

  expect(await findByText('حفظ الإشارة المرجعية')).toBeTruthy();
});

it('commits the chosen category to the store when save is pressed', async () => {
  const { findByLabelText, findByA11yLabel, findByText } = render(
    <SearchScreen initialQuery="الفرقان" />,
  );
  fireEvent.press(await findByLabelText(/حفظ الآية|Bookmark verse/i));
  fireEvent.press(await findByA11yLabel('chip-reading'));
  fireEvent.press(await findByText('حفظ'));

  await waitFor(() => {
    expect(mockAddBookmark).toHaveBeenCalledWith(2, 53, 'reading');
  });
});
```

- [ ] **Step 3: Run — confirm the bookmark assertions fail**

Run: `npm test -- --testPathPattern="SearchScreen.actions"`
Expected: FAIL — SearchScreen doesn't render the sheet yet; `mockAddBookmark` is never called.

- [ ] **Step 4: Update `SearchScreen.tsx` to host the sheet**

In `src/components/search/SearchScreen.tsx`:

a. Add imports near the top:

```ts
import { BookmarkCategorySheet, type BookmarkCommit } from '../quran/BookmarkCategorySheet';
import { useReadingStore } from '../../stores/readingStore';
import { getSurahByNumber } from '../../data/quranRepository';
import type { AyahSelection } from '../../data/types';
```

b. Inside the `SearchScreen` component (above `return (...)`), add the sheet state and handlers:

```ts
const addBookmark = useReadingStore((s) => s.addBookmark);
const removeBookmark = useReadingStore((s) => s.removeBookmark);
const getBookmarkCategories = useReadingStore((s) => s.getBookmarkCategories);

const [sheetSelection, setSheetSelection] = useState<AyahSelection | null>(null);
const [sheetSurahName, setSheetSurahName] = useState('');

const openSheet = useCallback(async (selection: AyahSelection) => {
  setSheetSelection(selection);
  try {
    const s = await getSurahByNumber(selection.startSurah);
    setSheetSurahName(isArabic ? s?.nameArabic ?? '' : s?.nameEnglish ?? '');
  } catch {
    setSheetSurahName('');
  }
}, [isArabic]);

const handleSheetCommit = useCallback((commit: BookmarkCommit) => {
  if (!sheetSelection) return;
  const { startSurah, startAyah } = sheetSelection;
  commit.added.forEach((c) => addBookmark(startSurah, startAyah, c));
  commit.removed.forEach((c) => removeBookmark(startSurah, startAyah, c));
  setSheetSelection(null);
}, [sheetSelection, addBookmark, removeBookmark]);

const handleSheetDismiss = useCallback(() => setSheetSelection(null), []);
```

c. Replace the existing `handleBookmark` callback (around line 153-160):

```ts
const handleBookmark = useCallback(
  (r: AyahSearchResult) => {
    handleAyahAction('bookmark', selectionFor(r), {
      onRequestBookmark: (sel) => {
        void openSheet(sel);
      },
    }).catch((err) => {
      console.warn('bookmark failed', err);
    });
  },
  [selectionFor, openSheet],
);
```

d. Render the sheet at the bottom of the JSX, just before the closing `</SafeAreaView>`:

```tsx
{sheetSelection && (
  <BookmarkCategorySheet
    surahName={sheetSurahName}
    ayahNumber={sheetSelection.startAyah}
    initialCategories={getBookmarkCategories(sheetSelection.startSurah, sheetSelection.startAyah)}
    onCommit={handleSheetCommit}
    onDismiss={handleSheetDismiss}
  />
)}
```

- [ ] **Step 5: Run the SearchScreen test — confirm it passes**

Run: `npm test -- --testPathPattern="SearchScreen.actions"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/search/SearchScreen.tsx src/components/search/__tests__/SearchScreen.actions.test.tsx
git commit -m "feat(bookmarks): host category sheet in SearchScreen"
```

---

## Task 13: Full typecheck + lint + suite + manual verification

**Files:**
- None modified — verification only.

- [ ] **Step 1: Run the full TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS with no errors.

- [ ] **Step 2: Run the linter**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Run the entire test suite**

Run: `npm test`
Expected: PASS for everything.

- [ ] **Step 4: Manual iOS simulator verification**

This is a native mobile app — UI verification must happen on the simulator (see CLAUDE.md). Steps:

1. Start the app:

   ```bash
   npm run ios
   ```

2. From Home, tap the new bookmark icon in the brand bar — should push to `/bookmarks`.
3. With no bookmarks: both tabs show their empty copy.
4. Go back to Home, open a surah, long-press an ayah to bring up the popup, tap the bookmark action — the category sheet appears. Toggle Reading on, tap Save. Snackbar shows "حُفِظ للقراءة".
5. Open the same ayah's bookmark sheet again — Reading chip pre-checked.
6. Repeat with Recitation. Open the bookmark sheet for a third time — both chips checked.
7. Press Undo on the snackbar after a save — bookmark state restores exactly.
8. Open `/bookmarks`. Switch tabs; both rows visible. Tap a row — opens the mushaf at the correct page.
9. Swipe a row from the physical trailing edge for the current language (Arabic RTL: physical left; English LTR: physical right) → Delete reveals → tap. Row removed from the active tab only; the other category retains the same ayah.
10. Repeat steps 8-9 from the Search tab (find an ayah, tap the bookmark icon, complete the flow).

Capture a screenshot at each major step:

```bash
xcrun simctl io booted screenshot /tmp/bookmarks-home.png
xcrun simctl io booted screenshot /tmp/bookmarks-sheet.png
xcrun simctl io booted screenshot /tmp/bookmarks-screen.png
```

Read the screenshots back with the Read tool to confirm.

- [ ] **Step 5: Commit nothing, end the plan**

If any manual step revealed a bug, fix it in a focused commit before declaring the plan complete.

---

## Out of scope (deferred)

- Bookmarks count badge on the Home icon.
- Custom user-defined categories beyond Reading/Recitation.
- Bookmark folders / tagging.
- Search within bookmarks.
- Sync across devices.

# Bookmarks: Reading & Recitation categories

**Date:** 2026-05-28
**Status:** Design — pending implementation

## Goal

Replace the current single-bucket bookmark feature (which only meaningfully surfaces the most recent bookmark) with a discoverable Bookmarks screen that organizes saved ayat under two categories — **Reading (القراءة)** and **Recitation (التلاوة)** — with explicit add, remove, and category-edit affordances.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Entry point | Icon button in the Home `BrandBar`, top-trailing edge |
| Category assignment | Picker sheet on save — user explicitly chooses category(ies) |
| Multi-category per ayah | Yes — same ayah can live in Reading, Recitation, or both |
| Screen layout | Pill tabs (Reading \| Recitation), one list visible at a time |
| Remove gesture | Swipe-to-delete |
| Row content | Position (surah · ayah · page) + first-line ayah preview |
| Tap row | Navigate to mushaf reader at the bookmarked page |

## Data model

### Type (`src/data/types.ts`)

```ts
export type BookmarkCategory = 'reading' | 'recitation';

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  category: BookmarkCategory;
  createdAt: number;
}
```

Identity is the tuple `(surahNumber, ayahNumber, category)`. Storing the same ayah twice (once per category) is valid and expected.

### Store (`src/stores/readingStore.ts`)

API:
- `addBookmark(surah, ayah, category)` — no-op if the exact tuple already exists.
- `removeBookmark(surah, ayah, category)` — filters by all three.
- `toggleBookmark(surah, ayah, category)` — same as before but category-scoped.
- `getBookmarkCategories(surah, ayah): BookmarkCategory[]` — selector helper for UI state (used by the picker sheet and the icon-active state).

Persistence stays on MMKV via `zustand/persist`. Bump `version` to `1` and add a `migrate` function: any pre-existing bookmark missing `category` becomes `{ ...b, category: 'reading' }`.

## Save flow — Category picker sheet

### Component

`src/components/quran/BookmarkCategorySheet.tsx`. A bottom sheet that slides up from the same position as `BookmarkSavedSnackbar` (above the mushaf toolbar).

### Behavior

- Opens pre-checked with the ayah's current categories (acts as both create-and-edit).
- Two toggle chips: "القراءة" and "التلاوة".
- Footer button "حفظ" commits a diff: add newly-checked, remove newly-unchecked. Closing the sheet without tapping save = no-op.
- "حذف الكل" button visible only when the ayah is currently in ≥1 category. Removes all and dismisses.
- Snapshot the previous category set on open so undo can fully restore it.

### Wiring

- `handleAyahAction` in `ayahActions.ts` grows an optional `callbacks` parameter: `{ onRequestBookmark?: (selection) => void }`. The `bookmark` case invokes `onRequestBookmark(selection)` instead of mutating the store. Hosts that expose bookmark actions must pass a callback that opens the sheet. The `setLastRead` call for streak tracking stays — bookmarking still counts as reading activity.
- `MushafScreenLayout` passes `onRequestBookmark` to `handleAyahAction`, and `MushafReader` hosts the sheet for popup-triggered bookmark actions.
- `MushafBottomToolbar` page-level bookmark routes through the same sheet, scoped to `pageTopAyah`.
- `SearchScreen` also hosts the same `BookmarkCategorySheet` for result-row bookmark actions. Do not leave Search calling `handleAyahAction('bookmark', selection)` without the callback; otherwise tapping the bookmark icon becomes a no-op under the new contract.

### Snackbar update

`BookmarkSavedSnackbar` accepts the resulting category set and renders one of four subtitles:
- "حُفِظ للقراءة" / "Saved for Reading"
- "حُفِظ للتلاوة" / "Saved for Recitation"
- "حُفِظ للقراءة والتلاوة" / "Saved for Reading and Recitation"
- "تم الحذف" / "Removed" — when commit resulted in zero categories.

Undo restores the snapshot exactly, including edit cases such as Reading -> Recitation, Both -> Reading, and Both -> Removed.

## Bookmarks screen

### Route

`src/app/bookmarks.tsx`. Pushed as a stack screen (not a tab). Standard back gesture returns to Home.

### Layout

```
┌──────────────────────────────────────────┐
│  ‹  الإشارات المرجعية                    │  header
├──────────────────────────────────────────┤
│  [ القراءة  ٤ ]  [ التلاوة  ٢ ]          │  pill tabs
├──────────────────────────────────────────┤
│  ▌ البقرة · آية ٢٥٥        ص ٤٢          │
│  اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ…          │
│  ─────────────────────────────────────   │
│  ▌ يس · آية ١              ص ٤٤٠         │
│  يس وَالْقُرْآنِ الْحَكِيمِ…              │
└──────────────────────────────────────────┘
```

### Components

- `src/components/bookmarks/BookmarksScreen.tsx` — root layout, owns active-tab state, hosts FlashList per tab.
- `src/components/bookmarks/BookmarkRow.tsx` — single row. Lazy-loads ayah preview text via per-row hook; cached at module scope.
- Reuse `src/components/home/PillTabs.tsx` for the tabhead. Tab labels include count badge ("القراءة  ٤").
- Empty states per tab using `src/constants/strings.ts` bookmark copy.

### Row interactions

- Press: `router.push({ pathname: '/surah/[id]', params: { id, page } })` where `page` comes from `getJuzAndPageForAyah(surah, ayah)`.
- Swipe trailing edge: reveals red "حذف" button. Tap = `removeBookmark(surah, ayah, currentTabCategory)`. Uses `react-native-gesture-handler`'s `Swipeable`. Under `forceRTL(true)`, the "trailing" edge resolves to the physical left automatically.
- Sort: newest first by `createdAt` desc.

### Gesture setup

Wrap the root app tree in `GestureHandlerRootView` in `src/app/_layout.tsx` so `Swipeable` works reliably on native. Keep the existing `Stack`, onboarding redirects, and `StatusBar` behavior inside that root wrapper.

### Ayah preview

New `getAyahPreview(surah, ayah): Promise<string>` in `quranRepository.ts`. Returns the first ~80 chars of the ayah's Uthmani text. Cached in a module-level `Map<string, string>` keyed by `${surah}:${ayah}` to avoid repeat DB hits.

## Home entry point

### Component change

`src/components/home/BrandBar.tsx` grows a trailing slot containing a 38×38 icon button.
- Background `theme.semantic.bgRaised`, border `theme.semantic.border`, radius `theme.radii.md`.
- Gold ribbon icon (`theme.palette.gold[400]`) sized 18×22.
- `accessibilityLabel`: `strings.bookmarks.openLabel`.
- `onPress`: `router.push('/bookmarks')`.
- Layout: update the outer row to span the available width and separate the brand cluster from the action slot (for example, `justifyContent: 'space-between'` with a trailing action container). The icon must not sit immediately beside the wordmark.

### RTL

`BrandBar` lays out with language-aware `direction` plus `flexDirection: 'row'`; with the separated trailing action container, the icon ends up top-right in Arabic and top-left in English.

### Surahs tab

`HomeView`'s `hideGreeting` prop suppresses the brand bar — the bookmark icon is not present in that surface. Acceptable; the Home tab is the canonical entry.

### Badge

No count badge in v1. Reassess after first usage signal.

## Reader behavior

| Trigger | Before | After |
|---|---|---|
| Ayah popup bookmark action | `toggleBookmark` directly | Opens `BookmarkCategorySheet` for selected ayah |
| Mushaf page toolbar bookmark | `toggleBookmark` on `pageTopAyah` | Opens `BookmarkCategorySheet` for `pageTopAyah` |
| Icon active state | "bookmarked" boolean | "in any category" (filled if `getBookmarkCategories(...).length > 0`) |

The page-level `bookmarkActive` logic in `MushafReader.tsx:182-188` keeps working unchanged since the underlying array now contains category-tagged rows but the existence check is category-agnostic.

## Strings (`src/constants/strings.ts`)

New `bookmarks` namespace under both `ar` and `en`:

```ts
bookmarks: {
  screenTitle: 'الإشارات المرجعية' | 'Bookmarks',
  tabReading: 'القراءة' | 'Reading',
  tabRecitation: 'التلاوة' | 'Recitation',
  openLabel: 'افتح الإشارات المرجعية' | 'Open bookmarks',
  emptyReading: 'لم تحفظ آيات للقراءة بعد' | 'No reading bookmarks yet',
  emptyRecitation: 'لم تحفظ آيات للتلاوة بعد' | 'No recitation bookmarks yet',
  deleteAction: 'حذف' | 'Delete',
  sheetTitle: 'حفظ الإشارة المرجعية' | 'Save bookmark',
  sheetSave: 'حفظ' | 'Save',
  sheetRemoveAll: 'حذف الكل' | 'Remove all',
  categoryReading: 'القراءة' | 'Reading',
  categoryRecitation: 'التلاوة' | 'Recitation',
}
```

The existing `bookmark.savedSubtitle(surahName, page, juz)` factory is replaced by four discrete factories matching the four outcomes: `savedSubtitleReading`, `savedSubtitleRecitation`, `savedSubtitleBoth`, `savedSubtitleRemoved`. Each takes `(surahName, page, juz)`. The snackbar picks the right one based on the diff result.

## Tests

| File | Coverage |
|---|---|
| `src/stores/__tests__/readingStore.bookmarks.test.ts` (new) | add/remove/toggle with category; multi-category on same ayah; migration of legacy `Bookmark` shape to `category: 'reading'` |
| `src/data/__tests__/quranRepository.bookmarkPreview.test.ts` (new) | `getAyahPreview` returns text truncated to ~80 chars |
| `src/components/quran/__tests__/BookmarkCategorySheet.test.tsx` (new) | renders pre-checked state from current categories; commits diff; undo restores exact snapshot for Reading -> Recitation, Both -> Reading, and Both -> Removed; "remove all" path; dismiss without save = no-op |
| `src/components/bookmarks/__tests__/BookmarksScreen.test.tsx` (new) | tab switching; empty state per tab; row tap navigates to `/surah/[id]?page=...`; swipe-delete removes only the current-tab category |
| `src/components/search/__tests__/SearchScreen.actions.test.tsx` (existing) | update: bookmark action opens the category sheet and commits through the same category diff flow |
| `src/components/quran/__tests__/MushafBottomToolbar.test.tsx` (existing) | update: tap dispatches "open sheet" intent rather than toggling directly |
| `src/components/home/__tests__/BrandBar.test.tsx` (existing or new) | bookmark icon renders; correct accessibility label; navigates to `/bookmarks` |

## File map

**New:**
- `src/app/bookmarks.tsx`
- `src/components/bookmarks/BookmarksScreen.tsx`
- `src/components/bookmarks/BookmarkRow.tsx`
- `src/components/bookmarks/__tests__/BookmarksScreen.test.tsx`
- `src/components/quran/BookmarkCategorySheet.tsx`
- `src/components/quran/__tests__/BookmarkCategorySheet.test.tsx`
- `src/stores/__tests__/readingStore.bookmarks.test.ts`
- `src/data/__tests__/quranRepository.bookmarkPreview.test.ts`

**Modified:**
- `src/app/_layout.tsx` — wrap the app tree in `GestureHandlerRootView` for swipe rows
- `src/data/types.ts` — add `BookmarkCategory`, extend `Bookmark`
- `src/stores/readingStore.ts` — category-scoped API, migration v1
- `src/data/quranRepository.ts` — add `getAyahPreview`
- `src/components/home/BrandBar.tsx` — trailing icon button
- `src/components/quran/AyahPopup.tsx` — bookmark action opens sheet
- `src/components/quran/MushafReader.tsx` — host the sheet, pass active categories through
- `src/components/quran/MushafScreenLayout.tsx` — pass the bookmark callback to `handleAyahAction`
- `src/components/quran/MushafBottomToolbar.tsx` — bookmark press opens sheet
- `src/components/quran/BookmarkSavedSnackbar.tsx` — category-aware subtitle, multi-category undo snapshot
- `src/components/search/SearchScreen.tsx` — host the same bookmark category sheet for search-result bookmark actions
- `src/actions/ayahActions.ts` — `bookmark` case returns "open sheet" intent; keeps `setLastRead`
- `src/constants/strings.ts` — `bookmarks` namespace in both locales

## Out of scope (v1)

- Bookmarks count badge on the Home icon.
- Custom user-defined categories beyond Reading/Recitation.
- Bookmark folders / tagging.
- Search within bookmarks.
- Sync across devices.

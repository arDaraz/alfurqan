# Qur'an Search — Design Spec

**Date:** 2026-05-27
**Status:** Approved (pending user sign-off on this doc)

## Goal

Replace the redundant "السور" (Surahs) tab — which today is a duplicate of the Home screen's surah list — with a Qur'an-wide ayah search. The user types a word or phrase and sees every ayah that contains it, grouped by surah, with surah name, ayah number, juz, and page. Tapping a result opens the Mushaf reader at that ayah's page.

The Surahs list remains available from the Home tab. Nothing about Home changes.

## Non-Goals

- Search inside translations (Arabic-only for v1).
- Full-text ranking / fuzzy matching / typo tolerance.
- Search history, saved searches, voice search.
- Server-side or sync'd search; everything is local to the bundled SQLite DB.
- Highlight on the Mushaf reader after a tap (the reader navigates to the correct page; in-page ayah highlight is a follow-up).

## User Flow

1. From any tab, the bottom bar shows a magnifier icon in the second slot, labelled "بحث" / "SEARCH".
2. Tapping it opens the Search screen with a focused input at the top.
3. As the user types (debounced 300ms), the screen renders collapsible groups — one per surah that contains a match.
4. Each group header shows surah name and ayah count. Expanding shows ayah rows: ayah marker `﴿N﴾`, ayah text (truncated to ~2 lines, with the matched substring bolded), and a breadcrumb `جزء X · ص Y`.
5. Tap an ayah row → `router.push('/surah/{n}?page={p}')`, landing on the mushaf page that contains the ayah.
6. Empty query shows a hint. Zero-results query shows "لا توجد نتائج" + the hint.

## Architecture

### Tab bar — `src/components/navigation/TabBar.tsx`
- Replace `IconSurahs` with a magnifier `IconSearch` (single-purpose private SVG component, same pattern as the other icons in the file).
- Change `renderTab('surahs', strings.tabSurahs, IconSurahs)` to `renderTab('search', strings.tabSearch, IconSearch)`.

### Route
- Rename `src/app/(tabs)/surahs.tsx` → `src/app/(tabs)/search.tsx`.
- Update `src/app/(tabs)/_layout.tsx`: `<Tabs.Screen name="surahs" />` → `<Tabs.Screen name="search" />`.
- New `search.tsx` renders `<SearchScreen />` from `src/components/search/SearchScreen.tsx`.

### Data layer — `src/data/quranRepository.ts`
Add:

```ts
export interface AyahSearchResult {
  surahNumber: number;
  ayahNumber: number;
  textUthmani: string;
  juzNumber: number;
  pageNumber: number;
}

export async function searchAyahs(query: string, limit?: number): Promise<AyahSearchResult[]>;
```

Implementation:
- Trim and `normalizeQuery(query)`; if empty after normalization, return `[]`.
- Load all ayahs once (`SELECT id, surah_number, ayah_number, text_uthmani, juz_number, page_number FROM ayahs ORDER BY surah_number, ayah_number`) and cache the array in a module-level variable so subsequent searches don't re-hit SQLite.
- For each cached row, compare `normalizeForSearch(text_uthmani)` to the normalized query with `String.prototype.includes`.
- Return every match by default. Only stop early when an explicit `limit` argument is provided (tests may pass a limit to verify the guard).
- Return matches in surah/ayah order (already pre-sorted by the query).

Why a single in-memory pass and not SQL `LIKE`:
- The DB column has Uthmani diacritics and `ٱ` (alif-wasla); the user types without them. `LIKE '%query%'` only works on raw text.
- 6,236 ayahs total → one full scan is ~30ms after the first warm-up on the simulator, well below interactive feel. No migration needed.

### Normalization — extend `src/utils/arabic.ts`
The existing `normalizeArabic()` strips `ً-ٟ` (harakat) and `ٰ` (dagger alif). Add to it (or introduce a new `normalizeForSearch()`):
- `ٱ` (`U+0671`, alif-wasla) → `ا` (`U+0627`)
- Tatweel `ـ` (`U+0640`) removed
- `ى` (`U+0649`, alif maqsura) → `ي` (`U+064A`) — common user-typing variant
- `ة` (`U+0629`, ta marbuta) → `ه` (`U+0647`) — common variant; optional, include behind the same call so behavior is consistent
- Quranic annotation marks `U+06D6-U+06DC`, `U+06DF-U+06E4`, and `U+06EA-U+06ED` removed — these appear in Uthmani text and are already stripped for display/clipboard in related utilities
- Collapse whitespace and trim

A single exported `normalizeForSearch(text: string): string` keeps both sides of the comparison identical. The display string stays unchanged.

### Components — `src/components/search/`

`SearchScreen.tsx`
- Owns `query` state and `debouncedQuery` (300ms via the same pattern as `useSearch.ts`).
- Loads surah metadata once via `getSurahs()`/`useSurahList()` and builds a `Map<number, Surah>` for result headers.
- Calls `searchAyahs(debouncedQuery)` inside an effect; stores `{ status, results, error }`.
- Protects the async search effect from stale results with a `cancelled` flag or monotonically increasing request id, so an older cold-cache search cannot overwrite a newer query.
- Groups results by `surahNumber` into `Array<{ surah: Surah, ayahs: AyahSearchResult[] }>` using the surah map and renders. If metadata is unexpectedly missing, fall back to the numeric surah label instead of dropping the result.
- Renders, in order: `BrandBar`-equivalent header ("بحث"), `SearchInput`, status area (hint | spinner | empty), `FlatList` of `SurahResultGroup`.

`SearchInput.tsx`
- Themed `TextInput` with a leading magnifier icon and a trailing clear button when non-empty.
- Visual parity with the home surah-search input (same height, radius, palette).

`SurahResultGroup.tsx`
- Header row: chevron, surah Arabic name, ayah count chip (`X آية`), tap toggles `expanded` state.
- Default state: first 3 groups expanded, the rest collapsed. (UX: top match is always visible without a tap.)
- When expanded, renders ayah rows.

`AyahResultRow.tsx`
- Left: ornament containing `﴿N﴾` (ayah number in Arabic-Indic via `toArabicIndic`).
- Right: ayah text truncated to 2 lines (`numberOfLines={2}`), matched substring rendered in bold via `<Text style={{ fontWeight: '700' }}>` inside the run.
- Footer: small caption `جزء X · ص Y`.
- `onPress` → `router.push(\`/surah/${surahNumber}?page=${pageNumber}\`)`.

### Match highlight — algorithm

```
displayText = cleanUthmaniForDisplay(textUthmani)  // unchanged
normDisplay = normalizeForSearch(displayText)
normQuery   = normalizeForSearch(query)
```

Since `normalizeForSearch` only removes or substitutes single characters (no insertions), we can build an index map from `normDisplay` back to `displayText`. Find each occurrence of `normQuery` in `normDisplay`, map start/end indices to the original `displayText`, and split into runs `[plain, match, plain, …]` for rendering. Falls back to no-highlight if the mapping yields an unexpected gap (defensive but should not hit in practice).

### Strings — `src/constants/strings.ts`

Arabic:
- `tabSearch`: `'بحث'`
- `searchAyahsPlaceholder`: `'ابحث في القرآن...'`
- `searchHint`: `'ابحث بكلمة أو عبارة من القرآن'`
- `searchNoResults`: `'لا توجد نتائج'`
- `searchGroupCount(n)`: `` `${n} آية` ``
- `searchAyahCrumb(juz, page)`: `` `جزء ${juz} · ص ${page}` ``

English:
- `tabSearch`: `'SEARCH'`
- `searchAyahsPlaceholder`: `'Search the Quran...'`
- `searchHint`: `'Search by a word or phrase from the Quran'`
- `searchNoResults`: `'No results'`
- `searchGroupCount(n)`: `` `${n} verses` ``
- `searchAyahCrumb(juz, page)`: `` `Juz ${juz} · p. ${page}` ``

Remove `tabSurahs` if no other references exist after the route rename; otherwise leave the key untouched (string deletion is not part of this feature).

## Tests

`src/data/__tests__/quranRepository.search.test.ts`
- `searchAyahs('الرحمن')` returns results from Al-Fatiha (1:1, 1:3) and Ar-Rahman (55:1) — proves alif-wasla folding works.
- `searchAyahs('')` returns `[]`.
- `searchAyahs('xyz')` returns `[]`.
- Limit honored: pass `limit = 5`, expect length ≤ 5.

`src/utils/__tests__/arabic.test.ts` (extend or add)
- `normalizeForSearch('ٱلرَّحْمَٰنِ')` equals `'الرحمن'`.
- `normalizeForSearch('ـالـرحـمـن')` equals `'الرحمن'`.
- `normalizeForSearch()` removes Quranic annotation marks in the `U+06D6-U+06ED` ranges without removing base letters.

`src/components/search/__tests__/SearchScreen.test.tsx`
- Renders input + hint when empty.
- After typing a known word, group headers appear with expected surah name and count.
- Tapping a group header toggles ayah visibility.

`tests/components/home/EnglishLocaleLayout.test.tsx`
- Update any assertion referencing `tabSurahs` text to `tabSearch`.

## Files Changed

- `src/components/navigation/TabBar.tsx` — icon + label swap
- `src/app/(tabs)/_layout.tsx` — route name swap
- `src/app/(tabs)/surahs.tsx` → `src/app/(tabs)/search.tsx` (renamed)
- `src/utils/arabic.ts` — extend normalization
- `src/data/quranRepository.ts` — add `searchAyahs`
- `src/constants/strings.ts` — new keys
- `src/components/search/SearchScreen.tsx` (new)
- `src/components/search/SearchInput.tsx` (new)
- `src/components/search/SurahResultGroup.tsx` (new)
- `src/components/search/AyahResultRow.tsx` (new)
- `src/data/__tests__/quranRepository.search.test.ts` (new)
- `src/utils/__tests__/arabic.test.ts` (extend)
- `src/components/search/__tests__/SearchScreen.test.tsx` (new)
- `tests/components/home/EnglishLocaleLayout.test.tsx` — update tab label assertion if applicable

## Open Questions

None remaining. All three sub-questions during brainstorming were resolved: route renamed, in-memory filter, substring highlight included.

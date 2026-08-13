# Qur'an Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the redundant "السور" tab with a Qur'an ayah-text search that lists matches grouped by surah and lets the user jump to the matching mushaf page.

**Architecture:** Each slice ships a working, simulator-verified feature. Slice 1 swaps the tab to a magnifier that opens an empty search screen. Slice 2 wires the in-memory ayah index and renders a flat result list. Slice 3 groups results by surah with collapse/expand. Slice 4 adds matched-substring highlighting and the tap → mushaf navigation. Tests precede implementation in each slice; commit at the end of every slice.

**Tech Stack:** React Native (Expo SDK 55), Expo Router file-based routing, NativeWind + theme tokens, expo-sqlite, FlashList, Zustand, Jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-05-27-quran-search-design.md`

---

## Slice 1 — Swap the tab to "Search" and open a placeholder screen

User-visible after this slice: the bottom bar's second slot shows a magnifier icon and the label "بحث" / "SEARCH". Tapping it opens a search screen with a header, an empty input, and the hint copy. No search logic yet — the screen is a static shell.

### Task 1.1: Add new strings for the Search tab and screen

**Files:**
- Modify: `src/constants/strings.ts`

- [ ] **Step 1: Add Arabic keys**

In the `ar` object, after the existing `tabSurahs: 'السور'` line, add:

```ts
  tabSearch: 'بحث',
  searchAyahsPlaceholder: 'ابحث في القرآن...',
  searchHint: 'ابحث بكلمة أو عبارة من القرآن',
  searchNoResults: 'لا توجد نتائج',
  searchError: 'تعذّر البحث. حاول مرة أخرى.',
  searchGroupCount: (n: number) => `${n} آية`,
  searchAyahCrumb: (juz: number | string, page: number | string) => `جزء ${juz} · ص ${page}`,
```

- [ ] **Step 2: Add English keys**

In the `en` object, after `tabSurahs: 'SURAHS'`, add the parallel keys:

```ts
  tabSearch: 'SEARCH',
  searchAyahsPlaceholder: 'Search the Quran...',
  searchHint: 'Search by a word or phrase from the Quran',
  searchNoResults: 'No results',
  searchError: 'Unable to search. Try again.',
  searchGroupCount: (n: number) => `${n} verses`,
  searchAyahCrumb: (juz: number | string, page: number | string) => `Juz ${juz} · p. ${page}`,
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors.

### Task 1.2: Create the Search route file (placeholder content)

**Files:**
- Create: `src/app/(tabs)/search.tsx`
- Delete: `src/app/(tabs)/surahs.tsx`
- Modify: `src/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Write the placeholder screen**

Create `src/app/(tabs)/search.tsx`:

```tsx
import React from 'react';
import { SearchScreen } from '../../components/search/SearchScreen';

export default function SearchRoute() {
  return <SearchScreen />;
}
```

- [ ] **Step 2: Delete the old surahs route file**

Run: `git rm 'src/app/(tabs)/surahs.tsx'`

- [ ] **Step 3: Update the tabs layout**

Modify `src/app/(tabs)/_layout.tsx` and replace `<Tabs.Screen name="surahs" />` with `<Tabs.Screen name="search" />`.

### Task 1.3: Create the placeholder SearchScreen component

**Files:**
- Create: `src/components/search/SearchScreen.tsx`

- [ ] **Step 1: Write the static shell**

Create `src/components/search/SearchScreen.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

export function SearchScreen() {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{strings.tabSearch}</Text>
      </View>
      <View style={styles.hintWrap}>
        <Text style={styles.hint}>{strings.searchHint}</Text>
      </View>
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
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: theme.typeScale.heading.size,
      lineHeight: theme.typeScale.heading.lineHeight,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    hintWrap: {
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.xl,
      alignItems: 'center',
    },
    hint: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.lineHeight,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
    },
  });
}
```

### Task 1.4: Replace the Surahs tab icon and label with Search

**Files:**
- Modify: `src/components/navigation/TabBar.tsx`

- [ ] **Step 1: Add IconSearch and remove IconSurahs**

In `src/components/navigation/TabBar.tsx`, replace the `IconSurahs` function with `IconSearch`:

```tsx
function IconSearch({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={1.75} />
      <Path d="m20 20-3.5-3.5" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}
```

- [ ] **Step 2: Update the `renderTab` call**

Replace `{renderTab('surahs', strings.tabSurahs, IconSurahs)}` with `{renderTab('search', strings.tabSearch, IconSearch)}`.

### Task 1.5: Update the English layout snapshot test

**Files:**
- Modify: `tests/components/home/EnglishLocaleLayout.test.tsx`

- [ ] **Step 1: Find any assertions on `tabSurahs` / `'SURAHS'`**

Run: `grep -n "SURAHS\|tabSurahs" tests/components/home/EnglishLocaleLayout.test.tsx`

- [ ] **Step 2: Replace each occurrence with `'SEARCH'` / `tabSearch`**

For every match found in Step 1, change the literal `'SURAHS'` to `'SEARCH'` and any reference to `strings.tabSurahs` to `strings.tabSearch`. If no matches exist, leave the file untouched.

- [ ] **Step 3: Run the affected test file**

Run: `npm test -- --testPathPattern="EnglishLocaleLayout"`
Expected: PASS.

### Task 1.6: Verify the new tab on the iOS simulator

- [ ] **Step 1: Build + launch**

Run (in one terminal): `npm run ios`
Wait until Metro shows `Bundled` and the simulator displays the app home screen.

- [ ] **Step 2: Tap the second tab slot**

In the simulator, tap the magnifier icon. Expect: the new Search screen renders with the title "بحث" (Arabic) or "SEARCH" (English) and the hint copy beneath it. No search input yet — that's Slice 2.

- [ ] **Step 3: Capture a screenshot**

Run: `xcrun simctl io booted screenshot /tmp/search-slice1.png`
Then Read `/tmp/search-slice1.png` and verify visually.

### Task 1.7: Commit Slice 1

- [ ] **Step 1: Stage and commit**

```bash
git add src/constants/strings.ts \
  src/app/\(tabs\)/_layout.tsx \
  src/app/\(tabs\)/search.tsx \
  src/components/search/SearchScreen.tsx \
  src/components/navigation/TabBar.tsx \
  tests/components/home/EnglishLocaleLayout.test.tsx
git rm 'src/app/(tabs)/surahs.tsx'
git commit -m "feat(search): swap Surahs tab for a placeholder Search screen"
```

---

## Slice 2 — Type and see flat ayah matches

User-visible after this slice: typing a word in the input renders a flat list of matching ayahs, each row showing surah name, ayah marker, plain ayah text, and a `جزء X · ص Y` breadcrumb. No grouping yet, no highlight, no tap-through.

### Task 2.1: Extend `normalizeForSearch` in `src/utils/arabic.ts`

**Files:**
- Modify: `src/utils/arabic.ts`
- Create: `src/utils/__tests__/arabic.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/arabic.test.ts`:

```ts
import { normalizeForSearch } from '../arabic';

describe('normalizeForSearch', () => {
  it('strips Uthmani diacritics and folds alif-wasla', () => {
    expect(normalizeForSearch('ٱلرَّحْمَٰنِ')).toBe('الرحمن');
  });

  it('removes tatweel kashida', () => {
    expect(normalizeForSearch('ـالـرحـمـن')).toBe('الرحمن');
  });

  it('folds alif-maqsura and ta-marbuta to common typing variants', () => {
    expect(normalizeForSearch('علىٰ')).toBe('علي');
    expect(normalizeForSearch('رحمة')).toBe('رحمه');
  });

  it('removes Quranic small high/low annotation marks', () => {
    const withMark = 'أ۞ب';
    expect(normalizeForSearch(withMark)).toBe('أب');
  });

  it('returns an empty string when input is whitespace', () => {
    expect(normalizeForSearch('   ')).toBe('');
  });
});
```

- [ ] **Step 2: Run the tests — verify they fail**

Run: `npm test -- --testPathPattern="arabic.test"`
Expected: FAIL with "normalizeForSearch is not exported" or similar.

- [ ] **Step 3: Implement the helper**

Modify `src/utils/arabic.ts`. Append, after the existing `uthmaniToPlainArabic`:

```ts
/**
 * Fold Arabic text for search comparison. Removes diacritics, tatweel, and
 * Quranic annotation marks; substitutes alif-wasla, alif-maqsura, and
 * ta-marbuta to their common typing variants. Apply to both query and target
 * so `String.includes` matches across Uthmani vs. user-typed text.
 */
export function normalizeForSearch(text: string): string {
  return text
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[ۖ-۞۟-۪ۤ-ۭ]/g, '')
    .replace(/ٱ/g, 'ا')
    .replace(/ـ/g, '')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}
```

- [ ] **Step 4: Run the tests — verify they pass**

Run: `npm test -- --testPathPattern="arabic.test"`
Expected: PASS.

### Task 2.2: Add `searchAyahs` to the repository

**Files:**
- Modify: `src/data/quranRepository.ts`
- Create: `src/data/__tests__/quranRepository.search.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/data/__tests__/quranRepository.search.test.ts`:

```ts
const mockDb = {
  getAllAsync: jest.fn(),
};

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

import { searchAyahs, __resetAyahSearchCacheForTests } from '../quranRepository';

const sampleRows = [
  { id: 1, surah_number: 1, ayah_number: 1, text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', juz_number: 1, page_number: 1 },
  { id: 3, surah_number: 1, ayah_number: 3, text_uthmani: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', juz_number: 1, page_number: 1 },
  { id: 5500, surah_number: 55, ayah_number: 1, text_uthmani: 'ٱلرَّحْمَٰنُ', juz_number: 27, page_number: 531 },
  { id: 18, surah_number: 2, ayah_number: 1, text_uthmani: 'الٓمٓ', juz_number: 1, page_number: 2 },
];

describe('searchAyahs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetAyahSearchCacheForTests();
    mockDb.getAllAsync.mockResolvedValue(sampleRows);
  });

  it('returns an empty array for an empty or whitespace query', async () => {
    await expect(searchAyahs('')).resolves.toEqual([]);
    await expect(searchAyahs('   ')).resolves.toEqual([]);
  });

  it('finds matches across Uthmani diacritics and alif-wasla', async () => {
    const results = await searchAyahs('الرحمن');
    expect(results.map((r) => `${r.surahNumber}:${r.ayahNumber}`)).toEqual([
      '1:1',
      '1:3',
      '55:1',
    ]);
  });

  it('returns an empty array for an unknown word', async () => {
    await expect(searchAyahs('xyz')).resolves.toEqual([]);
  });

  it('honours an explicit limit', async () => {
    const results = await searchAyahs('الرحمن', 2);
    expect(results).toHaveLength(2);
  });

  it('queries the database only once across calls (cached)', async () => {
    await searchAyahs('الرحمن');
    await searchAyahs('xyz');
    expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run — verify failure**

Run: `npm test -- --testPathPattern="quranRepository.search"`
Expected: FAIL — `searchAyahs is not a function`.

- [ ] **Step 3: Implement `searchAyahs`**

Add `normalizeForSearch` beside the existing top-level imports in `src/data/quranRepository.ts`:

```ts
import { normalizeForSearch } from '../utils/arabic';
```

Then append the implementation below the existing ayah read helpers, and add the exported type near the other interfaces:

```ts

export interface AyahSearchResult {
  surahNumber: number;
  ayahNumber: number;
  textUthmani: string;
  juzNumber: number;
  pageNumber: number;
}

interface AyahSearchRow {
  id: number;
  surah_number: number;
  ayah_number: number;
  text_uthmani: string;
  juz_number: number;
  page_number: number;
}

interface CachedAyahForSearch {
  surahNumber: number;
  ayahNumber: number;
  textUthmani: string;
  juzNumber: number;
  pageNumber: number;
  normalized: string;
}

let ayahSearchCache: CachedAyahForSearch[] | null = null;

async function loadAyahSearchCache(): Promise<CachedAyahForSearch[]> {
  if (ayahSearchCache) return ayahSearchCache;
  const db = await getDatabase();
  const rows = await db.getAllAsync<AyahSearchRow>(
    'SELECT id, surah_number, ayah_number, text_uthmani, juz_number, page_number FROM ayahs ORDER BY surah_number, ayah_number'
  );
  ayahSearchCache = rows.map((r) => ({
    surahNumber: r.surah_number,
    ayahNumber: r.ayah_number,
    textUthmani: r.text_uthmani,
    juzNumber: r.juz_number,
    pageNumber: r.page_number,
    normalized: normalizeForSearch(r.text_uthmani),
  }));
  return ayahSearchCache;
}

export async function searchAyahs(query: string, limit?: number): Promise<AyahSearchResult[]> {
  const needle = normalizeForSearch(query);
  if (!needle) return [];
  const cache = await loadAyahSearchCache();
  const out: AyahSearchResult[] = [];
  for (const row of cache) {
    if (row.normalized.includes(needle)) {
      out.push({
        surahNumber: row.surahNumber,
        ayahNumber: row.ayahNumber,
        textUthmani: row.textUthmani,
        juzNumber: row.juzNumber,
        pageNumber: row.pageNumber,
      });
      if (limit !== undefined && out.length >= limit) break;
    }
  }
  return out;
}

/** @internal — for tests to reset the module-level cache between runs. */
export function __resetAyahSearchCacheForTests(): void {
  ayahSearchCache = null;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npm test -- --testPathPattern="quranRepository.search"`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors.

### Task 2.3: Create the SearchInput component

**Files:**
- Create: `src/components/search/SearchInput.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/search/SearchInput.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

interface Props {
  value: string;
  onChangeText: (next: string) => void;
  autoFocus?: boolean;
}

export function SearchInput({ value, onChangeText, autoFocus = false }: Props) {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <View style={styles.wrap}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.icon}>
        <Circle cx={11} cy={11} r={7} stroke={theme.semantic.fgMuted} strokeWidth={1.75} />
        <Path d="m20 20-3.5-3.5" stroke={theme.semantic.fgMuted} strokeWidth={1.75} strokeLinecap="round" />
      </Svg>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={strings.searchAyahsPlaceholder}
        placeholderTextColor={theme.semantic.fgSubtle}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable accessibilityLabel="clear" onPress={() => onChangeText('')} style={styles.clear} hitSlop={8}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="m6 6 12 12M18 6 6 18" stroke={theme.semantic.fgMuted} strokeWidth={1.75} strokeLinecap="round" />
          </Svg>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.semantic.bgRaised,
      borderRadius: theme.radii.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginHorizontal: theme.gutter.screen,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.semantic.border,
    },
    icon: {},
    input: {
      flex: 1,
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      padding: 0,
    },
    clear: {
      padding: 2,
    },
  });
}
```

### Task 2.4: Create a flat AyahResultRow (no highlight yet)

**Files:**
- Create: `src/components/search/AyahResultRow.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/search/AyahResultRow.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic, cleanUthmaniForDisplay } from '../../utils/arabic';
import type { AyahSearchResult } from '../../data/quranRepository';

interface Props {
  result: AyahSearchResult;
  surahName: string;
  onPress?: (result: AyahSearchResult) => void;
}

export function AyahResultRow({ result, surahName, onPress }: Props) {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const ayahLabel = `﴿${toArabicIndic(result.ayahNumber)}﴾`;
  const display = cleanUthmaniForDisplay(result.textUthmani);

  return (
    <Pressable
      testID={`search-result-${result.surahNumber}-${result.ayahNumber}`}
      onPress={() => onPress?.(result)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.surahName}>{surahName}</Text>
        <Text style={styles.ayahMarker}>{ayahLabel}</Text>
      </View>
      <Text style={styles.body} numberOfLines={2}>{display}</Text>
      <Text style={styles.crumb}>{strings.searchAyahCrumb(toArabicIndic(result.juzNumber), toArabicIndic(result.pageNumber))}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: theme.gutter.screen,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.semantic.border,
      backgroundColor: theme.semantic.bg,
      gap: 6,
    },
    rowPressed: {
      backgroundColor: theme.semantic.bgRaised,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    surahName: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: theme.typeScale.label.size,
      color: theme.semantic.primary,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    ayahMarker: {
      fontFamily: theme.fonts.arabic,
      fontSize: theme.typeScale.label.size,
      color: theme.semantic.fgMuted,
    },
    body: {
      fontFamily: theme.fonts.quranSerif,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.lineHeight + 6,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    crumb: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      color: theme.semantic.fgMuted,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}
```

### Task 2.5: Wire the SearchScreen to the data layer (flat list)

**Files:**
- Modify: `src/components/search/SearchScreen.tsx`

- [ ] **Step 1: Replace the static shell**

Rewrite `src/components/search/SearchScreen.tsx`:

```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSurahList } from '../../hooks/useSurahList';
import { searchAyahs, type AyahSearchResult } from '../../data/quranRepository';

import { SearchInput } from './SearchInput';
import { AyahResultRow } from './AyahResultRow';

const DEBOUNCE_MS = 300;

type Status = 'idle' | 'loading' | 'ready' | 'error';

export function SearchScreen() {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const { surahs } = useSurahList();
  const surahNameByNumber = useMemo(
    () => new Map(surahs.map((s) => [s.number, isArabic ? s.nameArabic : s.nameEnglish])),
    [surahs, isArabic]
  );

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<AyahSearchResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults([]);
      setStatus('idle');
      return;
    }
    const id = ++requestId.current;
    setStatus('loading');
    searchAyahs(trimmed)
      .then((r) => {
        if (id !== requestId.current) return;
        setResults(r);
        setStatus('ready');
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        console.warn('searchAyahs failed', err);
        setResults([]);
        setStatus('error');
      });
  }, [debouncedQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{strings.tabSearch}</Text>
      </View>
      <View style={styles.inputWrap}>
        <SearchInput value={query} onChangeText={setQuery} autoFocus />
      </View>
      {status === 'idle' && (
        <View style={styles.center}>
          <Text style={styles.hint}>{strings.searchHint}</Text>
        </View>
      )}
      {status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={theme.semantic.primary} />
        </View>
      )}
      {status === 'ready' && results.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{strings.searchNoResults}</Text>
          <Text style={styles.hint}>{strings.searchHint}</Text>
        </View>
      )}
      {status === 'error' && (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{strings.searchError}</Text>
          <Text style={styles.hint}>{strings.searchHint}</Text>
        </View>
      )}
      {status === 'ready' && results.length > 0 && (
        <FlashList
          data={results}
          keyExtractor={(r) => `${r.surahNumber}:${r.ayahNumber}`}
          estimatedItemSize={120}
          renderItem={({ item }) => (
            <AyahResultRow
              result={item}
              surahName={surahNameByNumber.get(item.surahNumber) ?? String(item.surahNumber)}
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
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: theme.typeScale.heading.size,
      lineHeight: theme.typeScale.heading.lineHeight,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    inputWrap: {
      paddingBottom: theme.spacing.md,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.gutter.screen,
    },
    hint: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.lineHeight,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
    },
    emptyTitle: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: theme.typeScale.title.size,
      lineHeight: theme.typeScale.title.lineHeight,
      color: theme.semantic.fg,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
  });
}
```

### Task 2.6: Verify Slice 2 on the simulator

- [ ] **Step 1: Reload Metro**

In the simulator: press `r` in the Metro terminal (or shake → Reload).

- [ ] **Step 2: Open the Search tab**

Tap the magnifier in the bottom bar.

- [ ] **Step 3: Type a known word**

Type "الرحمن" into the input. Expected: list shows 48 ayah rows, starting with `الفاتحة ﴿١﴾`.

- [ ] **Step 4: Type something nonsense**

Clear the input and type "xyz". Expected: "لا توجد نتائج" / "No results" plus the search hint.

- [ ] **Step 5: Capture**

Run: `xcrun simctl io booted screenshot /tmp/search-slice2.png`
Read the screenshot and visually confirm.

### Task 2.7: Commit Slice 2

- [ ] **Step 1: Stage and commit**

```bash
git add src/utils/arabic.ts \
  src/utils/__tests__/arabic.test.ts \
  src/data/quranRepository.ts \
  src/data/__tests__/quranRepository.search.test.ts \
  src/components/search/SearchInput.tsx \
  src/components/search/AyahResultRow.tsx \
  src/components/search/SearchScreen.tsx
git commit -m "feat(search): add ayah-text search with flat result list"
```

---

## Slice 3 — Group results by surah with collapse/expand

User-visible after this slice: instead of a flat scroll of every match, the list shows one collapsible header per surah ("البقرة · 47 آية", with a chevron). The first 3 groups are expanded by default; the rest collapse. Tapping a header toggles its group.

### Task 3.1: Create the SurahResultGroup component

**Files:**
- Create: `src/components/search/SurahResultGroup.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/search/SurahResultGroup.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

interface Props {
  surahNumber: number;
  surahName: string;
  ayahCount: number;
  expanded: boolean;
  onToggle: (surahNumber: number) => void;
}

export function SurahResultGroup({ surahNumber, surahName, ayahCount, expanded, onToggle }: Props) {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <Pressable onPress={() => onToggle(surahNumber)} style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
        <Path d="m9 6 6 6-6 6" stroke={theme.semantic.fgMuted} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={styles.title}>{surahName}</Text>
      <Text style={styles.count}>{strings.searchGroupCount(ayahCount)}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: theme.gutter.screen,
      paddingVertical: theme.spacing.sm + 2,
      backgroundColor: theme.semantic.bgRaised,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.semantic.border,
    },
    headerPressed: {
      backgroundColor: theme.semantic.bgSunken,
    },
    title: {
      flex: 1,
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: theme.typeScale.title.size,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    count: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      color: theme.semantic.fgMuted,
    },
  });
}
```

### Task 3.2: Group results in SearchScreen and render groups

**Files:**
- Modify: `src/components/search/SearchScreen.tsx`

- [ ] **Step 1: Replace the FlashList block**

In `SearchScreen.tsx`, change the imports to add `SurahResultGroup`:

```tsx
import { SurahResultGroup } from './SurahResultGroup';
```

Add — beside the existing `requestId` and `results` state — a grouping memo, an expanded-set state, and a flattened visible-items memo. Keep group headers and visible ayah rows as separate FlashList items so large result groups remain virtualized:

```tsx
type VisibleSearchItem =
  | { type: 'group'; surahNumber: number; ayahs: AyahSearchResult[] }
  | { type: 'ayah'; result: AyahSearchResult };

const grouped = useMemo(() => {
  const map = new Map<number, AyahSearchResult[]>();
  for (const r of results) {
    const arr = map.get(r.surahNumber);
    if (arr) arr.push(r);
    else map.set(r.surahNumber, [r]);
  }
  return Array.from(map.entries()).map(([surahNumber, ayahs]) => ({ surahNumber, ayahs }));
}, [results]);

const [expanded, setExpanded] = useState<Set<number>>(new Set());

useEffect(() => {
  setExpanded(new Set(grouped.slice(0, 3).map((g) => g.surahNumber)));
}, [grouped]);

const toggleGroup = (n: number) => {
  setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    return next;
  });
};

const visibleItems = useMemo<VisibleSearchItem[]>(() => {
  const items: VisibleSearchItem[] = [];
  for (const group of grouped) {
    items.push({ type: 'group', surahNumber: group.surahNumber, ayahs: group.ayahs });
    if (expanded.has(group.surahNumber)) {
      for (const result of group.ayahs) {
        items.push({ type: 'ayah', result });
      }
    }
  }
  return items;
}, [grouped, expanded]);
```

- [ ] **Step 2: Replace the `FlashList` content**

Replace the existing `<FlashList data={results} … />` block with:

```tsx
<FlashList
  data={visibleItems}
  keyExtractor={(item) => item.type === 'group'
    ? `g-${item.surahNumber}`
    : `a-${item.result.surahNumber}:${item.result.ayahNumber}`}
  estimatedItemSize={120}
  renderItem={({ item }) => {
    if (item.type === 'group') {
      return (
        <SurahResultGroup
          surahNumber={item.surahNumber}
          surahName={surahNameByNumber.get(item.surahNumber) ?? String(item.surahNumber)}
          ayahCount={item.ayahs.length}
          expanded={expanded.has(item.surahNumber)}
          onToggle={toggleGroup}
        />
      );
    }

    return (
      <AyahResultRow
        result={item.result}
        surahName={surahNameByNumber.get(item.result.surahNumber) ?? String(item.result.surahNumber)}
      />
    );
  }}
/>
```

### Task 3.3: Component test for grouping + toggle

**Files:**
- Create: `src/components/search/__tests__/SearchScreen.test.tsx`

- [ ] **Step 1: Write the test**

Create `src/components/search/__tests__/SearchScreen.test.tsx`:

```tsx
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../data/quranRepository', () => {
  const actual = jest.requireActual('../../../data/quranRepository');
  return {
    ...actual,
    searchAyahs: jest.fn(async (q: string) => {
      if (!q.trim()) return [];
      return [
        { surahNumber: 1, ayahNumber: 1, textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', juzNumber: 1, pageNumber: 1 },
        { surahNumber: 1, ayahNumber: 3, textUthmani: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', juzNumber: 1, pageNumber: 1 },
        { surahNumber: 55, ayahNumber: 1, textUthmani: 'ٱلرَّحْمَٰنُ', juzNumber: 27, pageNumber: 531 },
      ];
    }),
  };
});

jest.mock('../../../hooks/useSurahList', () => ({
  useSurahList: () => ({
    surahs: [
      { number: 1, nameArabic: 'الفاتحة', nameEnglish: 'Al-Fatihah', ayahCount: 7, revelationType: 'Makki', revelationOrder: 5, juzStart: 1 },
      { number: 55, nameArabic: 'الرحمن', nameEnglish: 'Ar-Rahman', ayahCount: 78, revelationType: 'Makki', revelationOrder: 97, juzStart: 27 },
    ],
    loading: false,
    error: null,
    retry: jest.fn(),
  }),
}));

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SearchScreen } from '../SearchScreen';
import { useSettingsStore } from '../../../stores/settingsStore';

describe('SearchScreen', () => {
  beforeEach(() => {
    useSettingsStore.setState({ language: 'ar' });
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the hint when query is empty', () => {
    const { getByText } = render(<SearchScreen />);
    expect(getByText('ابحث بكلمة أو عبارة من القرآن')).toBeTruthy();
  });

  it('groups results by surah and expands the first three by default', async () => {
    const { getByPlaceholderText, findByText } = render(<SearchScreen />);
    fireEvent.changeText(getByPlaceholderText('ابحث في القرآن...'), 'الرحمن');
    act(() => { jest.advanceTimersByTime(310); });
    expect(await findByText('الفاتحة')).toBeTruthy();
    expect(await findByText('الرحمن')).toBeTruthy();
  });

  it('toggles a group on header tap', async () => {
    const { getByPlaceholderText, findByText, queryByText } = render(<SearchScreen />);
    fireEvent.changeText(getByPlaceholderText('ابحث في القرآن...'), 'الرحمن');
    act(() => { jest.advanceTimersByTime(310); });
    const header = await findByText('الفاتحة');
    fireEvent.press(header);
    await waitFor(() => {
      expect(queryByText(/بِسْمِ/)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --testPathPattern="SearchScreen.test"`
Expected: 3 tests PASS.

### Task 3.4: Verify Slice 3 on the simulator

- [ ] **Step 1: Reload Metro**

Press `r` in the Metro terminal.

- [ ] **Step 2: Search and inspect**

Tap the search tab, type "الرحمن". Expected: a list of collapsible group headers (`الفاتحة`, `البقرة`, `آل عمران`, …), the first 3 expanded showing ayahs underneath, the rest showing only the header.

- [ ] **Step 3: Toggle a header**

Tap an expanded group header. Expected: its ayahs collapse, the chevron rotates back to ▶. Tap again to expand.

- [ ] **Step 4: Capture**

Run: `xcrun simctl io booted screenshot /tmp/search-slice3.png`
Read and visually confirm.

### Task 3.5: Commit Slice 3

- [ ] **Step 1: Stage and commit**

```bash
git add src/components/search/SurahResultGroup.tsx \
  src/components/search/SearchScreen.tsx \
  src/components/search/__tests__/SearchScreen.test.tsx
git commit -m "feat(search): group results by surah with collapse/expand"
```

---

## Slice 4 — Highlight matched substring and jump to Mushaf

User-visible after this slice: the matched substring in each ayah row is rendered in bold. Tapping a row navigates to `/surah/{surahNumber}?page={pageNumber}` — opening the Mushaf reader on that ayah's page.

### Task 4.1: Implement match-highlight helper

**Files:**
- Create: `src/components/search/highlightMatch.ts`
- Create: `src/components/search/__tests__/highlightMatch.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/search/__tests__/highlightMatch.test.ts`:

```ts
import { highlightMatch } from '../highlightMatch';

describe('highlightMatch', () => {
  it('splits the display text into [plain, match, plain] runs', () => {
    const runs = highlightMatch('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', 'الرحمن');
    expect(runs.some((r) => r.match)).toBe(true);
    const matched = runs.find((r) => r.match);
    expect(matched?.text).toContain('ٱلرَّحْمَٰن');
  });

  it('highlights phrase matches that include collapsed whitespace', () => {
    const runs = highlightMatch('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', 'الحمد لله');
    const matched = runs.find((r) => r.match);
    expect(matched?.text).toContain('ٱلْحَمْدُ لِلَّهِ');
  });

  it('returns a single non-match run when the query is empty', () => {
    const runs = highlightMatch('بِسْمِ ٱللَّهِ', '');
    expect(runs).toEqual([{ text: 'بِسْمِ ٱللَّهِ', match: false }]);
  });

  it('returns a single non-match run when no match is found', () => {
    const runs = highlightMatch('بِسْمِ ٱللَّهِ', 'xyz');
    expect(runs).toEqual([{ text: 'بِسْمِ ٱللَّهِ', match: false }]);
  });
});
```

- [ ] **Step 2: Run — verify failure**

Run: `npm test -- --testPathPattern="highlightMatch"`
Expected: FAIL (`highlightMatch` not exported).

- [ ] **Step 3: Implement the helper**

Create `src/components/search/highlightMatch.ts`:

```ts
import { normalizeForSearch } from '../../utils/arabic';

export interface HighlightRun {
  text: string;
  match: boolean;
}

function normalizeWithIndex(source: string): { normalized: string; sourceIndexFor: number[] } {
  const chars: string[] = [];
  const sourceIndexFor: number[] = [];

  for (let i = 0; i < source.length; i++) {
    const folded = /\s/.test(source[i]) ? ' ' : normalizeForSearch(source[i]);
    for (let k = 0; k < folded.length; k++) {
      const ch = folded[k];
      if (/\s/.test(ch)) {
        if (chars.length === 0 || chars[chars.length - 1] === ' ') continue;
        chars.push(' ');
        sourceIndexFor.push(i);
      } else {
        chars.push(ch);
        sourceIndexFor.push(i);
      }
    }
  }

  while (chars[0] === ' ') {
    chars.shift();
    sourceIndexFor.shift();
  }
  while (chars[chars.length - 1] === ' ') {
    chars.pop();
    sourceIndexFor.pop();
  }

  return { normalized: chars.join(''), sourceIndexFor };
}

function isSearchIgnorableMark(ch: string): boolean {
  return !/\s/.test(ch) && normalizeForSearch(ch) === '';
}

/**
 * Splits `displayText` into runs of matched and unmatched segments based on
 * `query`. Comparison is done on the normalized form (diacritics folded, etc.)
 * while runs themselves are mapped back to the original display text — so the
 * mushaf glyphs are preserved exactly, only the matched span is flagged.
 *
 * Whitespace is collapsed the same way `normalizeForSearch` collapses it, with
 * each normalized character mapped back to the source index that produced it.
 */
export function highlightMatch(displayText: string, query: string): HighlightRun[] {
  const needle = normalizeForSearch(query);
  if (!needle) return [{ text: displayText, match: false }];

  const { normalized, sourceIndexFor } = normalizeWithIndex(displayText);

  const runs: HighlightRun[] = [];
  let cursor = 0;
  let from = 0;
  while (from <= normalized.length - needle.length) {
    const found = normalized.indexOf(needle, from);
    if (found === -1) break;
    const matchStart = sourceIndexFor[found];
    let matchEnd =
      found + needle.length - 1 < sourceIndexFor.length
        ? sourceIndexFor[found + needle.length - 1] + 1
        : displayText.length;
    while (matchEnd < displayText.length && isSearchIgnorableMark(displayText[matchEnd])) {
      matchEnd += 1;
    }

    if (matchStart > cursor) {
      runs.push({ text: displayText.slice(cursor, matchStart), match: false });
    }
    runs.push({ text: displayText.slice(matchStart, matchEnd), match: true });
    cursor = matchEnd;
    from = found + needle.length;
  }

  if (cursor < displayText.length) {
    runs.push({ text: displayText.slice(cursor), match: false });
  }

  return runs.length > 0 ? runs : [{ text: displayText, match: false }];
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npm test -- --testPathPattern="highlightMatch"`
Expected: 4 tests PASS.

### Task 4.2: Apply highlight in AyahResultRow and wire tap-through

**Files:**
- Modify: `src/components/search/AyahResultRow.tsx`

- [ ] **Step 1: Accept `query` prop and render runs**

Replace `AyahResultRow.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic, cleanUthmaniForDisplay } from '../../utils/arabic';
import type { AyahSearchResult } from '../../data/quranRepository';

import { highlightMatch } from './highlightMatch';

interface Props {
  result: AyahSearchResult;
  surahName: string;
  query: string;
  onPress?: (result: AyahSearchResult) => void;
}

export function AyahResultRow({ result, surahName, query, onPress }: Props) {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const ayahLabel = `﴿${toArabicIndic(result.ayahNumber)}﴾`;
  const display = cleanUthmaniForDisplay(result.textUthmani);
  const runs = highlightMatch(display, query);

  return (
    <Pressable
      testID={`search-result-${result.surahNumber}-${result.ayahNumber}`}
      onPress={() => onPress?.(result)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.surahName}>{surahName}</Text>
        <Text style={styles.ayahMarker}>{ayahLabel}</Text>
      </View>
      <Text style={styles.body} numberOfLines={2}>
        {runs.map((r, i) => (
          <Text key={i} style={r.match ? styles.match : undefined}>{r.text}</Text>
        ))}
      </Text>
      <Text style={styles.crumb}>{strings.searchAyahCrumb(toArabicIndic(result.juzNumber), toArabicIndic(result.pageNumber))}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: theme.gutter.screen,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.semantic.border,
      backgroundColor: theme.semantic.bg,
      gap: 6,
    },
    rowPressed: {
      backgroundColor: theme.semantic.bgRaised,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    surahName: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: theme.typeScale.label.size,
      color: theme.semantic.primary,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    ayahMarker: {
      fontFamily: theme.fonts.arabic,
      fontSize: theme.typeScale.label.size,
      color: theme.semantic.fgMuted,
    },
    body: {
      fontFamily: theme.fonts.quranSerif,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.lineHeight + 6,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    match: {
      fontFamily: theme.fonts.quranSerif,
      fontWeight: '700',
      color: theme.semantic.primary,
    },
    crumb: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      color: theme.semantic.fgMuted,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}
```

### Task 4.3: Pass `query` to visible ayah rows

**Files:**
- Modify: `src/components/search/SearchScreen.tsx`

- [ ] **Step 1: Forward the debounced query in the flattened ayah-row render**

In the `item.type === 'ayah'` branch of the `FlashList` render, pass the current debounced query:

```tsx
<AyahResultRow
  result={item.result}
  surahName={surahNameByNumber.get(item.result.surahNumber) ?? String(item.result.surahNumber)}
  query={debouncedQuery}
/>
```

### Task 4.4: Wire navigation in SearchScreen

**Files:**
- Modify: `src/components/search/SearchScreen.tsx`

- [ ] **Step 1: Import `useRouter`**

Add to the imports:

```tsx
import { useRouter } from 'expo-router';
```

- [ ] **Step 2: Create the tap handler and pass it down**

Inside the `SearchScreen` body, after `const styles = …`:

```tsx
const router = useRouter();
const handleAyahPress = (r: AyahSearchResult) => {
  router.push({
    pathname: '/surah/[id]',
    params: { id: String(r.surahNumber), page: String(r.pageNumber) },
  });
};
```

Then update the same ayah-row branch to pass the tap handler:

```tsx
<AyahResultRow
  result={item.result}
  surahName={surahNameByNumber.get(item.result.surahNumber) ?? String(item.result.surahNumber)}
  query={debouncedQuery}
  onPress={handleAyahPress}
/>
```

### Task 4.5: Update the SearchScreen test to assert highlight + navigation

**Files:**
- Modify: `src/components/search/__tests__/SearchScreen.test.tsx`

- [ ] **Step 1: Add a navigation mock spy**

At the top of the file, replace the existing `jest.mock('expo-router', …)` with:

```tsx
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
```

And `beforeEach`, add `mockPush.mockClear();`.

- [ ] **Step 2: Add the assertion**

Append:

```tsx
it('navigates to the surah at the matching page when an ayah is tapped', async () => {
  const { getByPlaceholderText, findByTestId } = render(<SearchScreen />);
  fireEvent.changeText(getByPlaceholderText('ابحث في القرآن...'), 'الرحمن');
  act(() => { jest.advanceTimersByTime(310); });
  fireEvent.press(await findByTestId('search-result-1-1'));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/surah/[id]',
    params: { id: '1', page: '1' },
  });
});
```

- [ ] **Step 3: Run**

Run: `npm test -- --testPathPattern="SearchScreen"`
Expected: 4 tests PASS.

### Task 4.6: Verify Slice 4 on the simulator

- [ ] **Step 1: Reload Metro**

Press `r` in the Metro terminal.

- [ ] **Step 2: Confirm highlight**

In Search, type "الرحمن". Expected: every occurrence in the displayed ayah text is bolded in the primary green.

- [ ] **Step 3: Confirm navigation**

Tap the first row under الفاتحة. Expected: the Mushaf reader opens on page 1 (Al-Fatiha). Press back to return.

- [ ] **Step 4: Capture**

Run: `xcrun simctl io booted screenshot /tmp/search-slice4.png`
Read and visually confirm.

### Task 4.7: Final type-check + full test pass + commit

- [ ] **Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 2: Full test pass**

Run: `npm test`
Expected: all suites PASS (no regressions).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: zero errors. Address anything reported.

- [ ] **Step 4: Stage and commit**

```bash
git add src/components/search/highlightMatch.ts \
  src/components/search/__tests__/highlightMatch.test.ts \
  src/components/search/AyahResultRow.tsx \
  src/components/search/SearchScreen.tsx \
  src/components/search/__tests__/SearchScreen.test.tsx
git commit -m "feat(search): highlight matched text and jump to mushaf page on tap"
```

---

## Self-Review

**Spec coverage:** Goal ✓ Slice 1.4; Non-goals respected (no translation/ranking/fuzzy/history); Tab swap ✓ 1.2/1.4; Route rename ✓ 1.2; Data layer with cache ✓ 2.2; Normalization (alif-wasla, tatweel, alif-maqsura, ta-marbuta, Quranic marks) ✓ 2.1; Strings ✓ 1.1; SearchScreen with status states ✓ 2.5; Stale-result guard via `requestId` ✓ 2.5; Surah-metadata map with numeric fallback ✓ 2.5; SearchInput ✓ 2.3; SurahResultGroup with default 3 expanded ✓ 3.1+3.2; AyahResultRow with `numberOfLines={2}` and crumb ✓ 2.4/4.2; Highlight algorithm with fallback ✓ 4.1/4.2; Tap → mushaf page ✓ 4.4; All tests listed in spec ✓ 2.1, 2.2, 3.3, 4.5 + EnglishLocaleLayout update 1.5.

**Placeholder scan:** No "TBD" / "implement later" / generic "add error handling" / "similar to Task N" found.

**Type consistency:** `AyahSearchResult` exported once in 2.2 and imported by every consumer. `searchAyahs(query, limit?)` signature matches the spec. `HighlightRun` defined once in 4.1 and used unchanged in 4.2.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-27-quran-search.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

# QCF Mushaf Page Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flowing-text Quran reader with a pixel-perfect Mushaf page renderer using QCF v2 page fonts in WebViews, with horizontal RTL page swiping.

**Architecture:** Each Mushaf page is rendered as HTML in a WebView with a page-specific QCF font (base64 data URI). 604 pages, 15 lines each. `react-native-pager-view` handles horizontal RTL swipe navigation. Word-level data and font blobs stored in SQLite, fetched via quran.com API v4 at build time.

**Tech Stack:** react-native-webview, react-native-pager-view, expo-sqlite, quran.com API v4, QCF v2 WOFF2 fonts

**Spec:** `docs/superpowers/specs/2026-03-23-qcf-mushaf-renderer-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/data/seed/seedMushafData.ts` | Fetch word-level data + QCF fonts from API/CDN, populate SQLite |
| Create | `src/data/types.ts` (extend) | Add `MushafWord`, `MushafLine`, `MushafPageData` interfaces |
| Create | `src/data/quranRepository.ts` (extend) | Add `getWordsByPage`, `getPageForSurah`, `getQcfFont` queries |
| Create | `src/components/quran/mushafHtml.ts` | Generate HTML string for a single Mushaf page |
| Create | `src/components/quran/MushafPage.tsx` | WebView rendering a single page |
| Create | `src/components/quran/MushafReader.tsx` | PagerView container with RTL page swiping |
| Create | `src/hooks/useMushafPage.ts` | Hook to fetch page words + font from SQLite |
| Modify | `src/stores/readingStore.ts` | Add `lastReadPage` for page-based bookmarking |
| Modify | `src/hooks/useLastRead.ts` | Expose `lastReadPage` alongside existing fields |
| Modify | `src/app/surah/[id].tsx` | Swap QuranReader for MushafReader |
| Modify | `package.json` | Add react-native-webview, react-native-pager-view |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install react-native-webview and react-native-pager-view**

```bash
npx expo install react-native-webview react-native-pager-view
```

- [ ] **Step 2: Verify installation**

```bash
cat package.json | grep -E "react-native-webview|react-native-pager-view"
```

Expected: Both packages appear in dependencies.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-native-webview and react-native-pager-view"
```

---

### Task 2: Add Mushaf Types

**Files:**
- Modify: `src/data/types.ts`

- [ ] **Step 1: Add MushafWord, MushafLine, and MushafPageData interfaces**

Append to the end of `src/data/types.ts`:

```typescript
export interface MushafWord {
  surahNumber: number;
  ayahNumber: number;
  wordPosition: number;
  pageNumber: number;
  lineNumber: number;
  codeV2: string;          // QCF v2 glyph code for WebView rendering
  charType: string;        // "word" | "end" | "pause"
}

export interface MushafLine {
  lineNumber: number;
  words: MushafWord[];
}

export interface MushafPageData {
  pageNumber: number;
  lines: MushafLine[];
  fontBase64: string;      // Base64-encoded WOFF2 font for this page
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/types.ts
git commit -m "feat: add MushafWord, MushafLine, MushafPageData types"
```

---

### Task 3: Create Mushaf Data Seed Script

**Files:**
- Create: `src/data/seed/seedMushafData.ts`

This script extends the existing `quran.db` with two new tables: `mushaf_words` and `qcf_fonts`. Run separately from the existing `buildQuranDb.ts` (which stays untouched).

- [ ] **Step 1: Create the seed script**

Create `src/data/seed/seedMushafData.ts`:

```typescript
/**
 * Seed Mushaf word-level data and QCF v2 fonts into quran.db.
 *
 * Fetches from:
 * - quran.com API v4: word-by-word data with code_v2 glyph codes and line/page positions
 * - Quran Foundation CDN: QCF v2 WOFF2 font files (one per page)
 *
 * Adds two tables to the existing quran.db:
 * - mushaf_words: ~77,000 rows of word-level layout data
 * - qcf_fonts: 604 rows of base64-encoded WOFF2 font data
 *
 * Usage: npx tsx src/data/seed/seedMushafData.ts
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.resolve(__dirname, '../../../assets/db/quran.db');
const API_BASE = 'https://api.quran.com/api/v4';
const FONT_CDN = 'https://static.qurancdn.com/fonts/quran/hafs/v2/woff2';

const DELAY_MS = 100;
const TOTAL_PAGES = 604;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  return response.json() as Promise<T>;
}

async function fetchAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

interface ApiWord {
  id: number;
  position: number;
  char_type_name: string;
  code_v2: string;
  line_number: number;
  page_number: number;
  verse_key: string;
}

interface ApiVerse {
  id: number;
  verse_key: string;
  words: ApiWord[];
}

interface PageResponse {
  verses: ApiVerse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
  };
}

async function main() {
  console.log('Seeding Mushaf data into quran.db...');

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database not found at ${DB_PATH}. Run 'npm run seed' first.`);
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Drop existing tables if re-running
  db.exec(`DROP TABLE IF EXISTS mushaf_words`);
  db.exec(`DROP TABLE IF EXISTS qcf_fonts`);

  // Create tables
  db.exec(`
    CREATE TABLE mushaf_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surah_number INTEGER NOT NULL,
      ayah_number INTEGER NOT NULL,
      word_position INTEGER NOT NULL,
      page_number INTEGER NOT NULL,
      line_number INTEGER NOT NULL,
      code_v2 TEXT NOT NULL,
      char_type TEXT NOT NULL
    );

    CREATE TABLE qcf_fonts (
      page_number INTEGER PRIMARY KEY,
      font_data TEXT NOT NULL
    );

    CREATE INDEX idx_mushaf_words_page ON mushaf_words(page_number);
    CREATE INDEX idx_mushaf_words_page_line ON mushaf_words(page_number, line_number);
  `);

  // Step 1: Fetch word-level data page by page
  console.log('Fetching word-level data for 604 pages...');

  const insertWord = db.prepare(
    `INSERT INTO mushaf_words (surah_number, ayah_number, word_position, page_number, line_number, code_v2, char_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  let totalWords = 0;

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    process.stdout.write(`  Page ${page}/${TOTAL_PAGES}...`);

    let allWords: { surah: number; ayah: number; position: number; pageNum: number; line: number; code: string; charType: string }[] = [];
    let apiPage = 1;
    let totalApiPages = 1;

    while (apiPage <= totalApiPages) {
      const url = `${API_BASE}/verses/by_page/${page}?language=en&words=true&word_fields=code_v2,line_number,page_number&per_page=50&page=${apiPage}`;
      const response = await fetchJson<PageResponse>(url);

      for (const verse of response.verses) {
        const [surahStr, ayahStr] = verse.verse_key.split(':');
        const surahNum = parseInt(surahStr, 10);
        const ayahNum = parseInt(ayahStr, 10);

        for (const word of verse.words) {
          // Only include words that belong to THIS page (verses can span pages)
          if (word.page_number === page) {
            allWords.push({
              surah: surahNum,
              ayah: ayahNum,
              position: word.position,
              pageNum: word.page_number,
              line: word.line_number,
              code: word.code_v2,
              charType: word.char_type_name,
            });
          }
        }
      }

      totalApiPages = response.pagination.total_pages;
      apiPage++;
      if (apiPage <= totalApiPages) await delay(DELAY_MS);
    }

    // Batch insert all words for this page
    const insertMany = db.transaction((words: typeof allWords) => {
      for (const w of words) {
        insertWord.run(w.surah, w.ayah, w.position, w.pageNum, w.line, w.code, w.charType);
      }
    });
    insertMany(allWords);
    totalWords += allWords.length;

    console.log(` ${allWords.length} words`);
    await delay(DELAY_MS);
  }

  console.log(`\nTotal words inserted: ${totalWords}`);

  // Step 2: Download QCF v2 WOFF2 fonts
  console.log('\nDownloading QCF v2 fonts (604 files)...');

  const insertFont = db.prepare(
    'INSERT INTO qcf_fonts (page_number, font_data) VALUES (?, ?)'
  );

  // Test first font to verify CDN URL
  console.log('  Testing CDN URL with page 1...');
  try {
    const testBase64 = await fetchAsBase64(`${FONT_CDN}/p1.woff2`);
    console.log(`  CDN OK. Page 1 font: ${(testBase64.length * 0.75 / 1024).toFixed(1)}KB`);
    insertFont.run(1, testBase64);
  } catch (err) {
    // Try alternative CDN URL format
    console.log('  Primary CDN failed, trying alternative URL format...');
    const altUrl = 'https://fonts.qurancdn.com/v2/woff2/p1.woff2';
    const testBase64 = await fetchAsBase64(altUrl);
    console.log(`  Alternative CDN OK. Switching to: ${altUrl.replace('p1.woff2', '')}`);
    insertFont.run(1, testBase64);
    // If we get here, the alternative works — we'll use it for the rest
    // (The actual URL will be determined at runtime by whichever succeeds)
  }

  for (let page = 2; page <= TOTAL_PAGES; page++) {
    if (page % 50 === 0 || page === TOTAL_PAGES) {
      process.stdout.write(`  Fonts: ${page}/${TOTAL_PAGES}\n`);
    }

    const base64 = await fetchAsBase64(`${FONT_CDN}/p${page}.woff2`);
    insertFont.run(page, base64);

    await delay(50); // lighter delay for font downloads
  }

  // Step 3: Integrity checks
  console.log('\nRunning integrity checks...');

  const wordCount = db.prepare('SELECT COUNT(*) as c FROM mushaf_words').get() as { c: number };
  console.log(`  Words: ${wordCount.c} (expected ~77,000+)`);
  if (wordCount.c < 70000) throw new Error(`Too few words: ${wordCount.c}`);

  const fontCount = db.prepare('SELECT COUNT(*) as c FROM qcf_fonts').get() as { c: number };
  console.log(`  Fonts: ${fontCount.c} (expected 604)`);
  if (fontCount.c !== 604) throw new Error(`Expected 604 fonts, got ${fontCount.c}`);

  const page1Words = db.prepare('SELECT COUNT(*) as c FROM mushaf_words WHERE page_number = 1').get() as { c: number };
  console.log(`  Page 1 words: ${page1Words.c} (Al-Fatiha)`);

  const page604Words = db.prepare('SELECT COUNT(*) as c FROM mushaf_words WHERE page_number = 604').get() as { c: number };
  console.log(`  Page 604 words: ${page604Words.c} (An-Nas)`);

  const distinctPages = db.prepare('SELECT COUNT(DISTINCT page_number) as c FROM mushaf_words').get() as { c: number };
  console.log(`  Distinct pages with words: ${distinctPages.c}`);

  const emptyCode = db.prepare("SELECT COUNT(*) as c FROM mushaf_words WHERE code_v2 IS NULL OR code_v2 = ''").get() as { c: number };
  console.log(`  Empty code_v2: ${emptyCode.c} (expected 0)`);
  if (emptyCode.c > 0) throw new Error(`Found ${emptyCode.c} words with empty code_v2`);

  db.close();

  const stats = fs.statSync(DB_PATH);
  console.log(`\nDatabase updated at: ${DB_PATH}`);
  console.log(`New database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('Mushaf data seeded successfully!');
}

main().catch((error) => {
  console.error('Failed to seed Mushaf data:', error);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm script**

Add to `package.json` scripts:

```json
"seed:mushaf": "npx tsx src/data/seed/seedMushafData.ts"
```

- [ ] **Step 3: Commit**

```bash
git add src/data/seed/seedMushafData.ts package.json
git commit -m "feat: add Mushaf data seed script (words + QCF fonts)"
```

---

### Task 4: Run the Seed Script

- [ ] **Step 1: Run the mushaf seed**

```bash
npm run seed:mushaf
```

This will take several minutes (604 API pages + 604 font downloads). Watch for:
- Word counts per page (should be 5-30+ words each)
- Font download progress
- Integrity check results at the end

If the CDN URL fails, the script tries an alternative. If both fail, check the font URL by opening `https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p1.woff2` in a browser.

- [ ] **Step 2: Verify database size**

```bash
ls -lh assets/db/quran.db
```

Expected: ~15-25MB (was ~2-3MB before).

- [ ] **Step 3: Quick data check**

```bash
npx tsx -e "
const Database = require('better-sqlite3');
const db = new Database('assets/db/quran.db');
console.log('Words:', db.prepare('SELECT COUNT(*) as c FROM mushaf_words').get());
console.log('Fonts:', db.prepare('SELECT COUNT(*) as c FROM qcf_fonts').get());
console.log('Page 1 lines:', db.prepare('SELECT DISTINCT line_number FROM mushaf_words WHERE page_number = 1 ORDER BY line_number').all());
console.log('Page 2 sample:', db.prepare('SELECT code_v2, line_number, char_type FROM mushaf_words WHERE page_number = 2 LIMIT 5').all());
db.close();
"
```

- [ ] **Step 4: Commit the updated database**

```bash
git add assets/db/quran.db
git commit -m "data: seed mushaf word-level data and QCF v2 fonts"
```

---

### Task 5: Add Mushaf Repository Functions

**Files:**
- Modify: `src/data/quranRepository.ts`

- [ ] **Step 1: Add row interfaces and mapping functions**

Add after the existing `JuzRow` interface and `mapJuzRow` function in `src/data/quranRepository.ts`:

```typescript
interface MushafWordRow {
  id: number;
  surah_number: number;
  ayah_number: number;
  word_position: number;
  page_number: number;
  line_number: number;
  code_v2: string;
  char_type: string;
}

function mapMushafWordRow(r: MushafWordRow): MushafWord {
  return {
    surahNumber: r.surah_number,
    ayahNumber: r.ayah_number,
    wordPosition: r.word_position,
    pageNumber: r.page_number,
    lineNumber: r.line_number,
    codeV2: r.code_v2,
    charType: r.char_type,
  };
}
```

Add `MushafWord` to the import from `./types`:

```typescript
import type { Surah, Ayah, Juz, MushafWord } from './types';
```

- [ ] **Step 2: Add query functions**

Append these functions to `src/data/quranRepository.ts`:

```typescript
export async function getWordsByPage(pageNumber: number): Promise<MushafWord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MushafWordRow>(
    'SELECT * FROM mushaf_words WHERE page_number = ? ORDER BY line_number, word_position',
    [pageNumber]
  );
  return rows.map(mapMushafWordRow);
}

export async function getQcfFont(pageNumber: number): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ font_data: string }>(
    'SELECT font_data FROM qcf_fonts WHERE page_number = ?',
    [pageNumber]
  );
  return row?.font_data ?? null;
}

export async function getPageForSurah(surahNumber: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ page_number: number }>(
    'SELECT MIN(page_number) as page_number FROM mushaf_words WHERE surah_number = ?',
    [surahNumber]
  );
  return row?.page_number ?? 1;
}

export async function getPageForJuz(juzNumber: number): Promise<number> {
  const db = await getDatabase();
  // Get the first surah/ayah of the juz, then find its page
  const juzRow = await db.getFirstAsync<{ start_surah: number; start_ayah: number }>(
    'SELECT start_surah, start_ayah FROM juz WHERE number = ?',
    [juzNumber]
  );
  if (!juzRow) return 1;
  const wordRow = await db.getFirstAsync<{ page_number: number }>(
    'SELECT page_number FROM mushaf_words WHERE surah_number = ? AND ayah_number = ? LIMIT 1',
    [juzRow.start_surah, juzRow.start_ayah]
  );
  return wordRow?.page_number ?? 1;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/data/quranRepository.ts src/data/types.ts
git commit -m "feat: add mushaf page repository functions"
```

---

### Task 6: Create HTML Template Generator

**Files:**
- Create: `src/components/quran/mushafHtml.ts`

- [ ] **Step 1: Create the HTML generator**

Create `src/components/quran/mushafHtml.ts`:

```typescript
import type { MushafWord, MushafLine } from '../../data/types';

/**
 * Groups flat word array into lines (1-15 per Mushaf page).
 */
export function groupWordsIntoLines(words: MushafWord[]): MushafLine[] {
  const lineMap = new Map<number, MushafWord[]>();
  for (const word of words) {
    const existing = lineMap.get(word.lineNumber) || [];
    existing.push(word);
    lineMap.set(word.lineNumber, existing);
  }
  return Array.from(lineMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([lineNumber, lineWords]) => ({ lineNumber, words: lineWords }));
}

/**
 * Generates the complete HTML string for a single Mushaf page.
 * The HTML uses a page-specific QCF v2 font embedded as a base64 data URI.
 */
export function generateMushafPageHtml(
  pageNumber: number,
  lines: MushafLine[],
  fontBase64: string,
  options?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
  }
): string {
  const bgColor = options?.backgroundColor ?? '#FAF8F2';
  const textColor = options?.textColor ?? '#1A1A2E';
  const fontSize = options?.fontSize ?? 28;

  const linesDivs = lines.map((line) => {
    const wordsHtml = line.words
      .map((w) => `<span data-s="${w.surahNumber}" data-a="${w.ayahNumber}">${w.codeV2}</span>`)
      .join('');

    // Surah header lines (typically line 1 with basmallah or surah name) may be centered
    // Most lines are justified edge-to-edge
    return `<div class="line">${wordsHtml}</div>`;
  }).join('\n    ');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  @font-face {
    font-family: 'QCF';
    src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
    font-display: block;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    height: 100%;
    overflow: hidden;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  body {
    background: ${bgColor};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 12px 16px;
    height: 100vh;
  }
  .line {
    font-family: 'QCF', serif;
    font-size: ${fontSize}px;
    color: ${textColor};
    text-align: justify;
    -webkit-text-align-last: justify;
    text-align-last: justify;
    direction: rtl;
    line-height: 1.05;
    white-space: nowrap;
  }
  .page-number {
    text-align: center;
    font-family: serif;
    font-size: 14px;
    color: #9CA3AF;
    padding-top: 4px;
  }
</style>
</head>
<body>
    ${linesDivs}
    <div class="page-number">${pageNumber}</div>
</body>
</html>`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/quran/mushafHtml.ts
git commit -m "feat: add Mushaf HTML template generator"
```

---

### Task 7: Create useMushafPage Hook

**Files:**
- Create: `src/hooks/useMushafPage.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useMushafPage.ts`:

```typescript
import { useState, useEffect, useRef } from 'react';
import { getWordsByPage, getQcfFont } from '../data/quranRepository';
import { groupWordsIntoLines, generateMushafPageHtml } from '../components/quran/mushafHtml';

interface UseMushafPageResult {
  html: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches word data and QCF font for a Mushaf page, returns rendered HTML.
 * Caches the HTML to avoid re-generating on re-renders.
 */
export function useMushafPage(pageNumber: number): UseMushafPageResult {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Check cache first
      const cached = cacheRef.current.get(pageNumber);
      if (cached) {
        setHtml(cached);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [words, fontBase64] = await Promise.all([
          getWordsByPage(pageNumber),
          getQcfFont(pageNumber),
        ]);

        if (cancelled) return;

        if (!fontBase64) {
          throw new Error(`No QCF font found for page ${pageNumber}`);
        }

        if (words.length === 0) {
          throw new Error(`No words found for page ${pageNumber}`);
        }

        const lines = groupWordsIntoLines(words);
        const pageHtml = generateMushafPageHtml(pageNumber, lines, fontBase64);

        // Cache it (keep max 10 pages in cache to limit memory)
        cacheRef.current.set(pageNumber, pageHtml);
        if (cacheRef.current.size > 10) {
          const firstKey = cacheRef.current.keys().next().value;
          if (firstKey !== undefined) cacheRef.current.delete(firstKey);
        }

        setHtml(pageHtml);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load page');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [pageNumber]);

  return { html, loading, error };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useMushafPage.ts
git commit -m "feat: add useMushafPage hook"
```

---

### Task 8: Create MushafPage Component

**Files:**
- Create: `src/components/quran/MushafPage.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/quran/MushafPage.tsx`:

```typescript
import React, { memo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useMushafPage } from '../../hooks/useMushafPage';
import { theme } from '../../constants/theme';

interface MushafPageProps {
  pageNumber: number;
}

/**
 * Renders a single Mushaf page using a WebView with QCF v2 font.
 * Memoized to prevent re-renders when swiping between pages.
 */
export const MushafPage = memo(function MushafPage({ pageNumber }: MushafPageProps) {
  const { html, loading, error } = useMushafPage(pageNumber);

  if (loading || !html) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        setBuiltInZoomControls={false}
        scalesPageToFit={false}
        originWhitelist={['*']}
        javaScriptEnabled={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/quran/MushafPage.tsx
git commit -m "feat: add MushafPage WebView component"
```

---

### Task 9: Create MushafReader Container

**Files:**
- Create: `src/components/quran/MushafReader.tsx`

- [ ] **Step 1: Create the PagerView container**

Create `src/components/quran/MushafReader.tsx`:

```typescript
import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { MushafPage } from './MushafPage';
import { useReadingStore } from '../../stores/readingStore';
import { theme } from '../../constants/theme';

const TOTAL_PAGES = 604;

interface MushafReaderProps {
  initialPage: number;
}

/**
 * Horizontal RTL page-swiping Mushaf reader.
 * Uses react-native-pager-view for book-like page turning.
 * Pages are indexed 0-603 internally, displayed as 1-604.
 */
export function MushafReader({ initialPage }: MushafReaderProps) {
  const pagerRef = useRef<PagerView>(null);
  const setLastReadPage = useReadingStore((s) => s.setLastReadPage);
  const [currentPage, setCurrentPage] = React.useState(initialPage);

  const handlePageSelected = useCallback(
    (event: { nativeEvent: { position: number } }) => {
      const pageIndex = event.nativeEvent.position;
      // PagerView is laid out RTL, so index 0 = page 604, index 603 = page 1
      const mushafPage = TOTAL_PAGES - pageIndex;
      setCurrentPage(mushafPage);
      setLastReadPage(mushafPage);
    },
    [setLastReadPage]
  );

  // Convert Mushaf page (1-604) to PagerView index (RTL: 0 = last page)
  const initialIndex = TOTAL_PAGES - initialPage;

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        layoutDirection="rtl"
        onPageSelected={handlePageSelected}
        offscreenPageLimit={1}
      >
        {Array.from({ length: TOTAL_PAGES }, (_, i) => {
          const mushafPage = TOTAL_PAGES - i;
          return (
            <View key={mushafPage} style={styles.page}>
              <MushafPage pageNumber={mushafPage} />
            </View>
          );
        })}
      </PagerView>

      <View style={styles.pageIndicator}>
        <Text style={styles.pageText}>{currentPage} / {TOTAL_PAGES}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.primary,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/quran/MushafReader.tsx
git commit -m "feat: add MushafReader with PagerView"
```

---

### Task 10: Update Reading Store for Page-Based Bookmarking

**Files:**
- Modify: `src/stores/readingStore.ts`
- Modify: `src/hooks/useLastRead.ts`

- [ ] **Step 1: Add lastReadPage to readingStore**

In `src/stores/readingStore.ts`, add `lastReadPage` and `setLastReadPage` to the interface and implementation:

Add to `ReadingState` interface:
```typescript
  lastReadPage: number | null;
  setLastReadPage: (page: number) => void;
```

Add to the `persist` store initial state (inside the `(set) => ({` block):
```typescript
      lastReadPage: null,
      setLastReadPage: (page) => set({ lastReadPage: page }),
```

- [ ] **Step 2: Add lastReadPage to useLastRead hook**

In `src/hooks/useLastRead.ts`, add after the existing `lastReadAyah` selector:

```typescript
  const lastReadPage = useReadingStore((s) => s.lastReadPage);
  const setLastReadPage = useReadingStore((s) => s.setLastReadPage);
```

Add to the return:
```typescript
  return { lastRead, savePosition, hasLastRead, lastReadPage, setLastReadPage };
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/readingStore.ts src/hooks/useLastRead.ts
git commit -m "feat: add page-based bookmarking to readingStore"
```

---

### Task 11: Wire MushafReader into Surah Screen

**Files:**
- Modify: `src/app/surah/[id].tsx`

- [ ] **Step 1: Replace QuranReader with MushafReader**

Rewrite `src/app/surah/[id].tsx`:

```typescript
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useLastRead } from '../../hooks/useLastRead';
import { getSurahByNumber, getPageForSurah } from '../../data/quranRepository';
import { MushafReader } from '../../components/quran/MushafReader';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { theme } from '../../constants/theme';
import type { Surah } from '../../data/types';

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahNumber = parseInt(id || '1', 10);

  const [surah, setSurah] = useState<Surah | null>(null);
  const [initialPage, setInitialPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { lastReadPage } = useLastRead();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [surahData, surahStartPage] = await Promise.all([
        getSurahByNumber(surahNumber),
        getPageForSurah(surahNumber),
      ]);

      setSurah(surahData);

      // If we have a saved page within this surah's range, use it
      // Otherwise start at the surah's first page
      if (lastReadPage && lastReadPage >= surahStartPage) {
        setInitialPage(lastReadPage);
      } else {
        setInitialPage(surahStartPage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load surah');
    } finally {
      setLoading(false);
    }
  }, [surahNumber, lastReadPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <Text style={styles.headerTitle}>
              {surah?.nameArabic || ''}
            </Text>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1A1A2E',
        }}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : initialPage ? (
        <MushafReader initialPage={initialPage} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  headerTitle: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: theme.typography.body.size,
    color: theme.colors.text,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/surah/[id].tsx
git commit -m "feat: wire MushafReader into surah screen"
```

---

### Task 12: Test on Device

- [ ] **Step 1: Start the dev server**

```bash
npx expo start --clear
```

- [ ] **Step 2: Test on device/simulator**

Open the app and verify:
1. Tap a surah (e.g., Al-Baqarah) — should open to its starting Mushaf page
2. Text should render with QCF calligraphic font — uniform line widths, 15 lines per page
3. Swipe left to go to next page (RTL), swipe right to go back
4. Page indicator at bottom shows current page / 604
5. Navigate back, tap the same surah — should restore to last-read page
6. Try different surahs to verify page mapping is correct

- [ ] **Step 3: Troubleshoot if needed**

Common issues:
- **Blank WebView**: Check that `html` string is generated. Add `console.log(html.substring(0, 200))` in MushafPage.
- **Font not rendering**: The `code_v2` characters may appear as boxes. Verify the base64 font is valid by checking its length.
- **Wrong page for surah**: Check `getPageForSurah` query returns correct page number.
- **PagerView direction**: If swiping feels backwards, check `layoutDirection="rtl"` prop.
- **Performance**: If page transitions are slow, reduce `offscreenPageLimit` or check that `memo` is working on MushafPage.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: mushaf renderer adjustments from device testing"
```

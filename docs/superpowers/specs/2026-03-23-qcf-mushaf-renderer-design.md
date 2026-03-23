# QCF Mushaf Page Renderer

## Problem

The current Quran reader renders ayahs as flowing text with ragged line widths. A proper Mushaf has uniform-width lines (15 lines per page, 604 pages) achieved through centuries-old calligraphic tradition. The app needs pixel-perfect Mushaf rendering.

## Solution

Replace the current flowing-text reader with a page-based Mushaf renderer using QCF (Quran Complex Font) v2 page fonts rendered in WebViews.

## Key Decisions

- **QCF v2 fonts**: 604 page-specific fonts where each word is a single calligraphic glyph. Pixel-perfect match to printed Madani Mushaf.
- **WebView rendering**: QCF fonts designed for web rendering. `code_v2` glyph codes work reliably with `innerHTML` in browsers. More reliable than native Text for these special Unicode characters.
- **Horizontal swipe (RTL)**: Book-like page turning. Swipe left = next page. One page at a time.
- **Surah entry point preserved**: Home screen unchanged. Tapping a surah opens the Mushaf at that surah's starting page.
- **Ayah selection deferred**: Focus on rendering. Selection is a Phase 3 concern.

## Data Layer

### New `words` table (~77,000 rows)

Seeded from quran.com API v4 `/verses/by_page/{page}?words=true`.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| surah_number | INTEGER | 1-114 |
| ayah_number | INTEGER | Verse number within surah |
| word_position | INTEGER | Word position within ayah |
| page_number | INTEGER | Mushaf page 1-604 |
| line_number | INTEGER | Line on page 1-15 |
| code_v2 | TEXT | QCF v2 glyph code |
| char_type | TEXT | "word", "end", "pause" |

### New `qcf_fonts` table (604 rows)

Downloaded from nuqayah/qpc-fonts GitHub repo or Quran Foundation CDN.

| Column | Type | Description |
|--------|------|-------------|
| page_number | INTEGER PK | 1-604 |
| font_data | TEXT | Base64-encoded WOFF2 font file |

### New repository functions

- `getWordsByPage(pageNumber)` — returns words ordered by line_number, position
- `getPageForSurah(surahNumber)` — returns starting page number
- `getPageForJuz(juzNumber)` — returns starting page number
- `getQcfFont(pageNumber)` — returns base64 font data
- `getTotalPages()` — returns 604

## Rendering Architecture

### MushafReader (container)

- Uses `react-native-pager-view` for horizontal RTL page swiping
- 604 total pages, only 3 mounted at a time (current +/- 1)
- Pre-fetches font + word data for adjacent pages
- Page indicator showing current page / 604
- Auto-saves current page to readingStore on page change

### MushafPage (single page)

- `react-native-webview` rendering a generated HTML string
- HTML includes:
  - `@font-face` with base64 data URI for the page's QCF font
  - 15 `<div class="line">` elements, each containing `<span>` word elements with `code_v2` text
  - CSS: full-width justified lines, cream background, proper spacing
  - Surah headers and bismillah are part of the QCF glyph data (no separate components needed)

### HTML Template Structure

```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<style>
  @font-face {
    font-family: 'QCF';
    src: url(data:font/woff2;base64,${fontData}) format('woff2');
  }
  body {
    margin: 0; padding: 16px;
    background: #FAF8F2;
    display: flex; flex-direction: column;
    justify-content: space-between;
    height: 100vh; box-sizing: border-box;
  }
  .line {
    font-family: 'QCF';
    font-size: ${fontSize}px;
    text-align: justify;
    text-align-last: justify;
    direction: rtl;
    line-height: 1.8;
    color: #1A1A2E;
  }
  .line.centered {
    text-align: center;
    text-align-last: center;
  }
</style>
</head>
<body>
  ${lines.map(line => `<div class="line${line.isCentered ? ' centered' : ''}">${line.words.map(w => w.code_v2).join('')}</div>`)}
</body>
</html>
```

## Navigation Flow

1. **Surah tap**: Query `SELECT MIN(page_number) FROM words WHERE surah_number = ?` → open MushafReader at that page
2. **Juz tap**: Query starting surah of juz → get its starting page → open MushafReader
3. **Last read**: readingStore has `lastReadPage` → open MushafReader at that page
4. **Page swipe**: RTL horizontal swipe between pages. PagerView handles gesture.

## Bookmarking

- `readingStore` updated: `lastReadPage: number | null` replaces ayah-based tracking
- `setLastReadPage(pageNumber)` called on every page change
- On surah re-open: reader opens at saved page if within that surah's page range

## File Changes

### New Files
- `src/components/quran/MushafReader.tsx` — PagerView container
- `src/components/quran/MushafPage.tsx` — WebView page component
- `src/components/quran/mushafHtml.ts` — HTML template generator
- `src/hooks/useMushafPage.ts` — fetch page words + font data

### Modified Files
- `src/data/seed/buildQuranDb.ts` — add words + fonts seeding
- `src/data/types.ts` — add Word, MushafPageData interfaces
- `src/data/quranRepository.ts` — add page-based queries
- `src/app/surah/[id].tsx` — swap QuranReader for MushafReader
- `src/stores/readingStore.ts` — page-based bookmarking

### Unchanged (but unused by Mushaf view)
- `src/components/quran/QuranReader.tsx` — keep for now, not rendered
- `src/components/quran/AyahText.tsx` — unused
- `src/components/quran/AyahEndMarker.tsx` — QCF includes end markers
- `src/components/quran/Bismillah.tsx` — QCF includes bismillah
- `src/components/quran/SurahHeaderBanner.tsx` — QCF includes headers

## New Dependencies

- `react-native-pager-view` — horizontal page swiping with RTL support
- `react-native-webview` — QCF font rendering in HTML

## Size Impact

- Words table: ~8MB
- Fonts table: ~9MB (604 WOFF2 fonts as base64)
- Total DB increase: ~17MB
- New JS bundle: negligible (2 components + 1 hook + 1 template)

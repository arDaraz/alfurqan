/**
 * Rebuild the bundled, offline regional Mushaf content packs.
 *
 * The Madani QCF V2 pack remains in the legacy `mushaf_words`/`qcf_fonts`
 * tables. This script installs QUL resource 12 (Qudratullah IndoPak 15-line)
 * into layout-keyed tables and bundles its matching Nastaleeq font.
 *
 * Source snapshots are intentionally explicit and checksummed. See
 * docs/mushaf-content-packs.md before updating either URL.
 */
import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const DB_PATH = resolve(ROOT, 'assets/db/quran.db');
const LAYOUT_ID = 'indopak-15-line-hafs';
const MADANI_LAYOUT_ID = 'madani-qcf-v2-hafs';
const MADANI_SOURCE_VERSION = 'quran-foundation-mushaf-1@2026-08-14';
const QUL_RESOURCE_ID = 12;
const SOURCE_VERSION = 'qul-resource-12@2026-08-14';
const PAGE_COUNT = 610;
const LINES_PER_PAGE = 15;
const MAX_CONCURRENCY = 8;
const FONT_URL =
  'https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/Hanafi/normal-v4.2.2/with-waqf-lazmi/font.woff2';
const MADANI_DATA_SHA256 = 'e4b3c4cf5c2d4ea9438a267bd6a9495bb25682101cd4c9f67ae6ce0ad835b745';
const MADANI_FONTS_SHA256 = '1798312207bab701df92a59b5cc80bd012158832dfd5b5a90bdcca6f044f9427';

type LineType = 'ayah' | 'surah_name' | 'basmallah' | 'empty';
type CharType = 'word' | 'end' | 'pause';

interface LayoutLineRow {
  pageNumber: number;
  lineNumber: number;
  lineType: LineType;
  isCentered: boolean;
  surahNumber: number | null;
}

interface LayoutWordRow {
  sourceWordId: number;
  canonicalWordKey: string;
  surahNumber: number;
  ayahNumber: number;
  wordPosition: number;
  pageNumber: number;
  lineNumber: number;
  displayText: string;
  charType: CharType;
}

interface ParsedPage {
  pageNumber: number;
  lines: LayoutLineRow[];
  words: LayoutWordRow[];
}

interface MadaniWordDigestRow {
  id: number;
  surah_number: number;
  ayah_number: number;
  word_position: number;
  page_number: number;
  line_number: number;
  code_v2: string;
  char_type: string;
}

interface MadaniFontDigestRow {
  page_number: number;
  font_data: string;
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCodePoint(Number(value)))
    .replace(/&#x([\da-f]+);/gi, (_, value: string) => String.fromCodePoint(parseInt(value, 16)))
    .replace(/&nbsp;/g, '\u00a0')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function attribute(markup: string, name: string): string | null {
  return markup.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;
}

function parsePage(pageNumber: number, html: string): ParsedPage {
  const pageStart = html.indexOf(`<div id="page-${pageNumber}"`);
  const pageEnd = html.indexOf('</turbo-frame>', pageStart);
  if (pageStart < 0 || pageEnd < 0) {
    throw new Error(`QUL page ${pageNumber} did not contain the expected page frame`);
  }

  const pageMarkup = html.slice(pageStart, pageEnd);
  const lineStarts = Array.from(pageMarkup.matchAll(/<div class="line-container" data-line="(\d+)">/g));
  if (lineStarts.length !== LINES_PER_PAGE) {
    throw new Error(
      `QUL page ${pageNumber} has ${lineStarts.length} lines; expected ${LINES_PER_PAGE}`
    );
  }

  const lines: LayoutLineRow[] = [];
  const words: LayoutWordRow[] = [];

  lineStarts.forEach((match, index) => {
    const lineNumber = Number(match[1]);
    const start = match.index ?? 0;
    const end = lineStarts[index + 1]?.index ?? pageMarkup.length;
    const lineMarkup = pageMarkup.slice(start, end);
    const className = lineMarkup.match(/<div class="line ([^"]*)" id="line-/)?.[1] ?? '';
    const isSurahName = className.includes('line--surah-name');
    const isBasmallah = className.includes('line--bismillah');
    const isCentered = className.includes('line--center') || isSurahName || isBasmallah;
    const surahNumber = isSurahName
      ? Number(lineMarkup.match(/surah(\d{3})/)?.[1] ?? 0) || null
      : null;

    const spans = Array.from(
      lineMarkup.matchAll(/<span class="([^"]*\bchar-(word|end|pause)\b[^"]*)"([^>]*)>([\s\S]*?)<\/span>/g)
    );

    lines.push({
      pageNumber,
      lineNumber,
      lineType: isSurahName
        ? 'surah_name'
        : isBasmallah
          ? 'basmallah'
          : spans.length > 0
            ? 'ayah'
            : 'empty',
      isCentered,
      surahNumber,
    });

    for (const span of spans) {
      const charType = span[2] as CharType;
      const markup = `${span[0]} ${span[3]}`;
      const sourceWordId = Number(attribute(markup, 'data-word-id'));
      const canonicalWordKey = attribute(markup, 'data-location');
      if (!sourceWordId || !canonicalWordKey) {
        throw new Error(`QUL page ${pageNumber}, line ${lineNumber} has an unidentifiable word`);
      }
      const [surahNumber, ayahNumber, wordPosition] = canonicalWordKey.split(':').map(Number);
      const displayText = decodeHtml(span[4]);
      if (!surahNumber || !ayahNumber || !wordPosition || !displayText) {
        throw new Error(`Invalid QUL word ${canonicalWordKey} on page ${pageNumber}`);
      }

      words.push({
        sourceWordId,
        canonicalWordKey,
        surahNumber,
        ayahNumber,
        wordPosition,
        pageNumber,
        lineNumber,
        displayText,
        charType,
      });
    }
  });

  return { pageNumber, lines, words };
}

async function fetchWithRetry(url: string, attempts = 4): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mushaf-Al-Furqan-content-pack-builder/1.0' },
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status} for ${url}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 500));
  }
  throw lastError;
}

async function fetchPage(pageNumber: number): Promise<ParsedPage> {
  const url = `https://qul.tarteel.ai/resources/mushaf-layout/${QUL_RESOURCE_ID}?page=${pageNumber}`;
  const response = await fetchWithRetry(url);
  return parsePage(pageNumber, await response.text());
}

async function fetchAllPages(): Promise<ParsedPage[]> {
  const pages = Array.from({ length: PAGE_COUNT }, (_, index) => index + 1);
  const results = new Array<ParsedPage>(PAGE_COUNT);
  let cursor = 0;

  const workers = Array.from({ length: MAX_CONCURRENCY }, async () => {
    while (cursor < pages.length) {
      const currentIndex = cursor;
      cursor += 1;
      const pageNumber = pages[currentIndex];
      results[currentIndex] = await fetchPage(pageNumber);
      if (pageNumber === 1 || pageNumber % 50 === 0 || pageNumber === PAGE_COUNT) {
        console.log(`Fetched QUL layout page ${pageNumber}/${PAGE_COUNT}`);
      }
    }
  });

  await Promise.all(workers);
  return results;
}

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function layoutDigest(pages: ParsedPage[]): string {
  const hash = createHash('sha256');
  for (const page of pages) {
    for (const line of page.lines) {
      hash.update(
        `${line.pageNumber}|${line.lineNumber}|${line.lineType}|${Number(line.isCentered)}|${line.surahNumber ?? ''}\n`
      );
    }
    for (const word of page.words) {
      hash.update(
        `${word.sourceWordId}|${word.canonicalWordKey}|${word.pageNumber}|${word.lineNumber}|${word.charType}|${word.displayText}\n`
      );
    }
  }
  return hash.digest('hex');
}

function verifyMadaniPack(db: InstanceType<typeof Database>): {
  dataSha256: string;
  fontsSha256: string;
} {
  const dataHash = createHash('sha256');
  const words = db.prepare(
    `SELECT id, surah_number, ayah_number, word_position, page_number,
            line_number, code_v2, char_type FROM mushaf_words ORDER BY id`
  ).iterate() as IterableIterator<MadaniWordDigestRow>;
  for (const word of words) {
    dataHash.update(
      `${word.id}|${word.surah_number}|${word.ayah_number}|${word.word_position}|${word.page_number}|${word.line_number}|${word.code_v2}|${word.char_type}\n`
    );
  }

  const fontsHash = createHash('sha256');
  const fonts = db.prepare(
    'SELECT page_number, font_data FROM qcf_fonts ORDER BY page_number'
  ).iterate() as IterableIterator<MadaniFontDigestRow>;
  for (const font of fonts) {
    const pageChecksum = sha256(Buffer.from(font.font_data, 'base64'));
    fontsHash.update(`${font.page_number}|${pageChecksum}\n`);
  }

  const result = { dataSha256: dataHash.digest('hex'), fontsSha256: fontsHash.digest('hex') };
  if (result.dataSha256 !== MADANI_DATA_SHA256 || result.fontsSha256 !== MADANI_FONTS_SHA256) {
    throw new Error(`The retained Madani QCF V2 pack does not match its pinned checksums`);
  }
  return result;
}

async function main() {
  const [pages, fontResponse] = await Promise.all([fetchAllPages(), fetchWithRetry(FONT_URL)]);
  const fontBytes = new Uint8Array(await fontResponse.arrayBuffer());
  const fontChecksum = sha256(fontBytes);
  const dataChecksum = layoutDigest(pages);
  const totalWords = pages.reduce((sum, page) => sum + page.words.length, 0);
  const uniqueAyahs = new Set(
    pages.flatMap((page) => page.words.map((word) => `${word.surahNumber}:${word.ayahNumber}`))
  ).size;

  if (uniqueAyahs !== 6236) throw new Error(`Expected 6,236 ayahs, found ${uniqueAyahs}`);
  if (totalWords < 80_000 || totalWords > 90_000) {
    throw new Error(`Expected 80,000-90,000 display tokens, found ${totalWords}`);
  }

  const ayatulKursi = pages
    .flatMap((page) => page.words)
    .find((word) => word.surahNumber === 2 && word.ayahNumber === 255);
  // Pin the resource itself, not the Quran Foundation tutorial's illustrative
  // 2:255 -> 44 mapping. QUL resource 12 currently places 2:255 on page 42;
  // the discrepancy is documented for qualified content review.
  if (ayatulKursi?.pageNumber !== 42) {
    throw new Error(`Expected QUL resource 12 to place 2:255 on page 42, found ${ayatulKursi?.pageNumber}`);
  }
  const finalWord = pages.at(-1)?.words.at(-1);
  if (finalWord?.canonicalWordKey !== '114:6:4') {
    throw new Error(`Expected the final canonical token 114:6:4, found ${finalWord?.canonicalWordKey}`);
  }

  const db = new Database(DB_PATH);
  const madaniChecksums = verifyMadaniPack(db);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS mushaf_layout_lines (
      layout_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      line_number INTEGER NOT NULL,
      line_type TEXT NOT NULL CHECK(line_type IN ('ayah', 'surah_name', 'basmallah', 'empty')),
      is_centered INTEGER NOT NULL CHECK(is_centered IN (0, 1)),
      surah_number INTEGER,
      PRIMARY KEY(layout_id, page_number, line_number)
    );

    CREATE TABLE IF NOT EXISTS mushaf_layout_words (
      layout_id TEXT NOT NULL,
      source_word_id INTEGER NOT NULL,
      canonical_word_key TEXT NOT NULL,
      surah_number INTEGER NOT NULL,
      ayah_number INTEGER NOT NULL,
      word_position INTEGER NOT NULL,
      page_number INTEGER NOT NULL,
      line_number INTEGER NOT NULL,
      display_text TEXT NOT NULL,
      semantic_text TEXT NOT NULL,
      char_type TEXT NOT NULL CHECK(char_type IN ('word', 'end', 'pause')),
      PRIMARY KEY(layout_id, canonical_word_key),
      UNIQUE(layout_id, source_word_id)
    );

    CREATE INDEX IF NOT EXISTS idx_layout_words_page
      ON mushaf_layout_words(layout_id, page_number, line_number, source_word_id);
    CREATE INDEX IF NOT EXISTS idx_layout_words_ayah
      ON mushaf_layout_words(layout_id, surah_number, ayah_number, word_position);

    CREATE TABLE IF NOT EXISTS mushaf_layout_assets (
      layout_id TEXT NOT NULL,
      asset_key TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      data_base64 TEXT NOT NULL,
      PRIMARY KEY(layout_id, asset_key)
    );

    CREATE TABLE IF NOT EXISTS mushaf_layout_manifests (
      layout_id TEXT PRIMARY KEY,
      source_version TEXT NOT NULL,
      data_sha256 TEXT NOT NULL,
      font_sha256 TEXT NOT NULL,
      page_count INTEGER NOT NULL,
      lines_per_page INTEGER NOT NULL,
      word_count INTEGER NOT NULL,
      ayah_count INTEGER NOT NULL,
      generated_at TEXT NOT NULL
    );
  `);

  const insertLine = db.prepare(`
    INSERT INTO mushaf_layout_lines
      (layout_id, page_number, line_number, line_type, is_centered, surah_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertWord = db.prepare(`
    INSERT INTO mushaf_layout_words
      (layout_id, source_word_id, canonical_word_key, surah_number, ayah_number,
       word_position, page_number, line_number, display_text, semantic_text, char_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    db.prepare('DELETE FROM mushaf_layout_lines WHERE layout_id = ?').run(LAYOUT_ID);
    db.prepare('DELETE FROM mushaf_layout_words WHERE layout_id = ?').run(LAYOUT_ID);
    db.prepare('DELETE FROM mushaf_layout_assets WHERE layout_id = ?').run(LAYOUT_ID);
    db.prepare('DELETE FROM mushaf_layout_manifests WHERE layout_id = ?').run(LAYOUT_ID);
    db.prepare('DELETE FROM mushaf_layout_manifests WHERE layout_id = ?').run(MADANI_LAYOUT_ID);

    db.prepare(`
      INSERT INTO mushaf_layout_manifests
        (layout_id, source_version, data_sha256, font_sha256, page_count,
         lines_per_page, word_count, ayah_count, generated_at)
      VALUES (?, ?, ?, ?, 604, 15, 83665, 6236, ?)
    `).run(
      MADANI_LAYOUT_ID,
      MADANI_SOURCE_VERSION,
      madaniChecksums.dataSha256,
      madaniChecksums.fontsSha256,
      '2026-08-14T00:00:00.000Z'
    );

    for (const page of pages) {
      for (const line of page.lines) {
        insertLine.run(
          LAYOUT_ID,
          line.pageNumber,
          line.lineNumber,
          line.lineType,
          Number(line.isCentered),
          line.surahNumber
        );
      }
      for (const word of page.words) {
        insertWord.run(
          LAYOUT_ID,
          word.sourceWordId,
          word.canonicalWordKey,
          word.surahNumber,
          word.ayahNumber,
          word.wordPosition,
          word.pageNumber,
          word.lineNumber,
          word.displayText,
          word.displayText,
          word.charType
        );
      }
    }

    db.prepare(`
      INSERT INTO mushaf_layout_assets
        (layout_id, asset_key, mime_type, sha256, data_base64)
      VALUES (?, 'primary-font', 'font/woff2', ?, ?)
    `).run(LAYOUT_ID, fontChecksum, Buffer.from(fontBytes).toString('base64'));

    db.prepare(`
      INSERT INTO mushaf_layout_manifests
        (layout_id, source_version, data_sha256, font_sha256, page_count,
         lines_per_page, word_count, ayah_count, generated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      LAYOUT_ID,
      SOURCE_VERSION,
      dataChecksum,
      fontChecksum,
      PAGE_COUNT,
      LINES_PER_PAGE,
      totalWords,
      uniqueAyahs,
      '2026-08-14T00:00:00.000Z'
    );
  })();

  db.pragma('wal_checkpoint(TRUNCATE)');
  db.pragma('journal_mode = DELETE');
  db.pragma('user_version = 3');
  db.exec('VACUUM');
  db.close();

  const databaseChecksum = sha256(readFileSync(DB_PATH));
  console.log(
    JSON.stringify(
      {
        layoutId: LAYOUT_ID,
        sourceVersion: SOURCE_VERSION,
        pages: PAGE_COUNT,
        lines: PAGE_COUNT * LINES_PER_PAGE,
        words: totalWords,
        ayahs: uniqueAyahs,
        madaniDataSha256: madaniChecksums.dataSha256,
        madaniFontsSha256: madaniChecksums.fontsSha256,
        dataSha256: dataChecksum,
        fontSha256: fontChecksum,
        databaseSha256: databaseChecksum,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { getDatabase } from './database';
import type { Surah, Ayah, Juz, MushafWord, PageMarker } from './types';
import { toArabicIndic, uthmaniToPlainArabic, normalizeForSearch } from '../utils/arabic';
import { QUARTER_LABELS } from '../constants/quran';

interface SurahRow {
  number: number;
  name_arabic: string;
  name_english: string;
  ayah_count: number;
  revelation_type: string;
  revelation_order: number;
  juz_start: number;
}

interface AyahRow {
  id: number;
  surah_number: number;
  ayah_number: number;
  text_uthmani: string;
  juz_number: number;
  hizb_number: number;
  page_number: number;
}

interface JuzRow {
  number: number;
  start_surah: number;
  start_ayah: number;
  end_surah: number;
  end_ayah: number;
}

function mapSurahRow(r: SurahRow): Surah {
  return {
    number: r.number,
    nameArabic: r.name_arabic,
    nameEnglish: r.name_english,
    ayahCount: r.ayah_count,
    revelationType: r.revelation_type as 'Makki' | 'Madani',
    revelationOrder: r.revelation_order,
    juzStart: r.juz_start,
  };
}

function mapAyahRow(r: AyahRow): Ayah {
  return {
    id: r.id,
    surahNumber: r.surah_number,
    ayahNumber: r.ayah_number,
    textUthmani: r.text_uthmani,
    juzNumber: r.juz_number,
    hizbNumber: r.hizb_number,
    pageNumber: r.page_number,
  };
}

function mapJuzRow(r: JuzRow): Juz {
  return {
    number: r.number,
    startSurah: r.start_surah,
    startAyah: r.start_ayah,
    endSurah: r.end_surah,
    endAyah: r.end_ayah,
  };
}

export async function getSurahs(): Promise<Surah[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SurahRow>('SELECT * FROM surahs ORDER BY number');
  return rows.map(mapSurahRow);
}

export async function getSurahByNumber(surahNumber: number): Promise<Surah | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SurahRow>(
    'SELECT * FROM surahs WHERE number = ?',
    [surahNumber]
  );
  if (!row) return null;
  return mapSurahRow(row);
}

export async function getSurahLastAyah(surahNumber: number): Promise<number> {
  const surah = await getSurahByNumber(surahNumber);
  if (!surah) throw new Error(`Surah ${surahNumber} not found`);
  return surah.ayahCount;
}

export async function getTopAyahForPage(
  pageNumber: number
): Promise<{ surahNumber: number; ayahNumber: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ surah_number: number; ayah_number: number }>(
    `SELECT surah_number, ayah_number
     FROM mushaf_words
     WHERE page_number = ?
     GROUP BY surah_number, ayah_number
     ORDER BY MIN(line_number), MIN(id)
     LIMIT 1`,
    [pageNumber]
  );
  if (!row) throw new Error(`No ayah found for page ${pageNumber}`);
  return { surahNumber: row.surah_number, ayahNumber: row.ayah_number };
}

export async function getPageForAyah(surahNumber: number, ayahNumber: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ page_number: number }>(
    'SELECT page_number FROM ayahs WHERE surah_number = ? AND ayah_number = ?',
    [surahNumber, ayahNumber]
  );
  if (!row) throw new Error(`No page found for surah ${surahNumber}, ayah ${ayahNumber}`);
  return row.page_number;
}

export async function getJuzAndPageForAyah(
  surahNumber: number,
  ayahNumber: number
): Promise<{ juz: number; page: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ juz_number: number; page_number: number }>(
    'SELECT juz_number, page_number FROM ayahs WHERE surah_number = ? AND ayah_number = ?',
    [surahNumber, ayahNumber]
  );
  if (!row) throw new Error(`No juz/page found for surah ${surahNumber}, ayah ${ayahNumber}`);
  return { juz: row.juz_number, page: row.page_number };
}

// TODO: Currently fetches within a single surah. Add cross-surah support when
// the selection UI allows spanning across surah boundaries.
export async function getAyahTextRange(
  surahNumber: number,
  startAyah: number,
  endAyah: number
): Promise<string> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ text_uthmani: string; ayah_number: number }>(
    'SELECT text_uthmani, ayah_number FROM ayahs WHERE surah_number = ? AND ayah_number >= ? AND ayah_number <= ? ORDER BY ayah_number',
    [surahNumber, startAyah, endAyah]
  );
  return rows
    .map((r) => `${uthmaniToPlainArabic(r.text_uthmani)} ﴿${toArabicIndic(r.ayah_number)}﴾`)
    .join('\n');
}

export async function getAyahsBySurah(surahNumber: number): Promise<Ayah[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AyahRow>(
    'SELECT * FROM ayahs WHERE surah_number = ? ORDER BY ayah_number',
    [surahNumber]
  );
  return rows.map(mapAyahRow);
}

export async function getAyahsByPage(pageNumber: number): Promise<Ayah[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AyahRow>(
    'SELECT * FROM ayahs WHERE page_number = ? ORDER BY surah_number, ayah_number',
    [pageNumber]
  );
  return rows.map(mapAyahRow);
}

export async function getJuzList(): Promise<Juz[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<JuzRow>('SELECT * FROM juz ORDER BY number');
  return rows.map(mapJuzRow);
}

export async function searchSurahs(query: string): Promise<Surah[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SurahRow>(
    'SELECT * FROM surahs WHERE name_english LIKE ? OR name_arabic LIKE ? OR CAST(number AS TEXT) = ? ORDER BY number',
    [`%${query}%`, `%${query}%`, query]
  );
  return rows.map(mapSurahRow);
}

// --- Mushaf QCF data ---

interface MushafWordRow {
  id: number;
  surah_number: number;
  ayah_number: number;
  word_position: number;
  page_number: number;
  line_number: number;
  code_v1?: string;
  code_v2?: string;
  text_indopak?: string;
  char_type: string;
}

function mapMushafWordRow(r: MushafWordRow, code: string = r.code_v2 ?? ''): MushafWord {
  return {
    id: r.id,
    surahNumber: r.surah_number,
    ayahNumber: r.ayah_number,
    wordPosition: r.word_position,
    pageNumber: r.page_number,
    lineNumber: r.line_number,
    codeV2: code,
    charType: r.char_type as 'word' | 'end' | 'pause',
  };
}

export async function getWordsByPage(pageNumber: number): Promise<MushafWord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MushafWordRow>(
    'SELECT * FROM mushaf_words WHERE page_number = ? ORDER BY line_number, id',
    [pageNumber]
  );
  return rows.map((row) => mapMushafWordRow(row));
}

const QURAN_API_BASE = 'https://api.quran.com/api/v4';
const QCF_V1_FONT_CDN = 'https://verses.quran.foundation/fonts/quran/hafs/v1/woff2';
const QCF_V4_FONT_CDN = 'https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2';
const INDOPAK_NASTALEEQ_FONT_URL = 'https://verses.quran.foundation/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2';
const DIGITAL_KHATT_INDOPAK_FONT_URL = 'https://quranfonts.com/fonts/Digital%20Khatt%20Indopak%20font/DigitalKhattIndoPak.otf';

interface QcfV1WordApi {
  id: number;
  position: number;
  char_type_name: string;
  code_v1: string;
  line_number: number;
  page_number: number;
}

interface QcfV1PageResponse {
  verses: Array<{
    verse_key: string;
    words: QcfV1WordApi[];
  }>;
  pagination: {
    next_page: number | null;
  };
}

interface IndopakWordApi {
  id: number;
  position: number;
  char_type_name: string;
  text_indopak: string;
  line_number: number;
  page_number: number;
}

interface IndopakPageResponse {
  verses: Array<{
    verse_key: string;
    words: IndopakWordApi[];
  }>;
  pagination: {
    next_page: number | null;
  };
}

interface UthmaniWordApi {
  id: number;
  position: number;
  char_type_name: string;
  text_uthmani: string;
  line_number: number;
  page_number: number;
}

interface UthmaniPageResponse {
  verses: Array<{
    verse_key: string;
    words: UthmaniWordApi[];
  }>;
  pagination: {
    next_page: number | null;
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let i = 0;

  for (; i + 2 < bytes.length; i += 3) {
    output += chars[bytes[i] >> 2];
    output += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    output += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    output += chars[bytes[i + 2] & 63];
  }

  if (i < bytes.length) {
    output += chars[bytes[i] >> 2];
    if (i + 1 < bytes.length) {
      output += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      output += chars[(bytes[i + 1] & 15) << 2];
      output += '=';
    } else {
      output += chars[(bytes[i] & 3) << 4];
      output += '==';
    }
  }

  return output;
}

async function fetchQcfV1WordsByPage(pageNumber: number): Promise<MushafWord[]> {
  const words: MushafWord[] = [];
  let apiPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_page/${pageNumber}?words=true&per_page=50&page=${apiPage}&word_fields=code_v1,line_number,page_number&fields=verse_key`
    );
    if (!response.ok) {
      throw new Error(`Unable to fetch QCF V1 words for page ${pageNumber}`);
    }

    const data = await response.json() as QcfV1PageResponse;
    for (const verse of data.verses) {
      const [surahStr, ayahStr] = verse.verse_key.split(':');
      const surah = Number(surahStr);
      const ayah = Number(ayahStr);

      for (const word of verse.words) {
        words.push({
          id: word.id,
          surahNumber: surah,
          ayahNumber: ayah,
          wordPosition: word.position,
          pageNumber: word.page_number,
          lineNumber: word.line_number,
          codeV2: word.code_v1,
          charType: word.char_type_name as 'word' | 'end' | 'pause',
        });
      }
    }

    hasMore = data.pagination.next_page !== null;
    apiPage++;
  }

  return words;
}

async function fetchIndopakWordsByPage(pageNumber: number): Promise<MushafWord[]> {
  const words: MushafWord[] = [];
  let apiPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_page/${pageNumber}?words=true&per_page=50&page=${apiPage}&word_fields=text_indopak,line_number,page_number&fields=verse_key&mushaf=3`
    );
    if (!response.ok) {
      throw new Error(`Unable to fetch IndoPak words for page ${pageNumber}`);
    }

    const data = await response.json() as IndopakPageResponse;
    for (const verse of data.verses) {
      const [surahStr, ayahStr] = verse.verse_key.split(':');
      const surah = Number(surahStr);
      const ayah = Number(ayahStr);

      for (const word of verse.words) {
        words.push({
          id: word.id,
          surahNumber: surah,
          ayahNumber: ayah,
          wordPosition: word.position,
          pageNumber: word.page_number,
          lineNumber: word.line_number,
          codeV2: word.text_indopak,
          charType: word.char_type_name as 'word' | 'end' | 'pause',
        });
      }
    }

    hasMore = data.pagination.next_page !== null;
    apiPage++;
  }

  return words;
}

async function fetchUthmaniWordsByPage(pageNumber: number): Promise<MushafWord[]> {
  const words: MushafWord[] = [];
  let apiPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_page/${pageNumber}?words=true&per_page=50&page=${apiPage}&word_fields=text_uthmani,line_number,page_number&fields=verse_key`
    );
    if (!response.ok) {
      throw new Error(`Unable to fetch Uthmani words for page ${pageNumber}`);
    }

    const data = await response.json() as UthmaniPageResponse;
    for (const verse of data.verses) {
      const [surahStr, ayahStr] = verse.verse_key.split(':');
      const surah = Number(surahStr);
      const ayah = Number(ayahStr);

      for (const word of verse.words) {
        words.push({
          id: word.id,
          surahNumber: surah,
          ayahNumber: ayah,
          wordPosition: word.position,
          pageNumber: word.page_number,
          lineNumber: word.line_number,
          codeV2: word.text_uthmani,
          charType: word.char_type_name as 'word' | 'end' | 'pause',
        });
      }
    }

    hasMore = data.pagination.next_page !== null;
    apiPage++;
  }

  return words;
}

export async function getQcfV1WordsByPage(pageNumber: number): Promise<MushafWord[]> {
  const db = await getDatabase();

  try {
    const rows = await db.getAllAsync<MushafWordRow>(
      `SELECT
         id,
         surah_number,
         ayah_number,
         word_position,
         page_number,
         line_number,
         code_v1,
         code_v1 as code_v2,
         char_type
       FROM mushaf_words
       WHERE page_number = ?
       ORDER BY line_number, id`,
      [pageNumber]
    );
    if (rows.length > 0 && rows.every((row) => row.code_v1)) {
      return rows.map((row) => mapMushafWordRow(row, row.code_v1!));
    }
  } catch {
    // Older bundled databases only include QCF V2; fall through to the API.
  }

  return fetchQcfV1WordsByPage(pageNumber);
}

export async function getIndopakWordsByPage(pageNumber: number): Promise<MushafWord[]> {
  const db = await getDatabase();

  try {
    const rows = await db.getAllAsync<MushafWordRow>(
      `SELECT
         id,
         surah_number,
         ayah_number,
         word_position,
         page_number,
         line_number,
         text_indopak,
         text_indopak as code_v2,
         char_type
       FROM indopak_words
       WHERE page_number = ?
       ORDER BY line_number, id`,
      [pageNumber]
    );
    if (rows.length > 0 && rows.every((row) => row.text_indopak)) {
      return rows.map((row) => mapMushafWordRow(row, row.text_indopak!));
    }
  } catch {
    // Older bundled databases only include QCF glyph columns; fall through to the API.
  }

  return fetchIndopakWordsByPage(pageNumber);
}

export async function getUthmaniWordsByPage(pageNumber: number): Promise<MushafWord[]> {
  return fetchUthmaniWordsByPage(pageNumber);
}

export async function getQcfFont(pageNumber: number): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ font_data: string }>(
    'SELECT font_data FROM qcf_fonts WHERE page_number = ?',
    [pageNumber]
  );
  return row?.font_data ?? null;
}

export async function getQcfV1Font(pageNumber: number): Promise<string | null> {
  const db = await getDatabase();

  try {
    const row = await db.getFirstAsync<{ font_data: string }>(
      'SELECT font_data FROM qcf_v1_fonts WHERE page_number = ?',
      [pageNumber]
    );
    if (row?.font_data) return row.font_data;
  } catch {
    // Older bundled databases only include QCF V2; fall through to the CDN.
  }

  const response = await fetch(`${QCF_V1_FONT_CDN}/p${pageNumber}.woff2`);
  if (!response.ok) {
    throw new Error(`Unable to fetch QCF V1 font for page ${pageNumber}`);
  }

  return arrayBufferToBase64(await response.arrayBuffer());
}

export async function getQcfV4Font(pageNumber: number): Promise<string | null> {
  const db = await getDatabase();

  try {
    const row = await db.getFirstAsync<{ font_data: string }>(
      'SELECT font_data FROM qcf_v4_fonts WHERE page_number = ?',
      [pageNumber]
    );
    if (row?.font_data) return row.font_data;
  } catch {
    // Older bundled databases only include QCF V2; fall through to the CDN.
  }

  const response = await fetch(`${QCF_V4_FONT_CDN}/p${pageNumber}.woff2`);
  if (!response.ok) {
    throw new Error(`Unable to fetch QCF V4 font for page ${pageNumber}`);
  }

  return arrayBufferToBase64(await response.arrayBuffer());
}

async function fetchStaticFont(url: string, label: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch ${label} font`);
  }

  return arrayBufferToBase64(await response.arrayBuffer());
}

export async function getIndopakNastaleeqFont(): Promise<string | null> {
  return fetchStaticFont(INDOPAK_NASTALEEQ_FONT_URL, 'IndoPak Nastaleeq');
}

export async function getDigitalKhattIndopakFont(): Promise<string | null> {
  return fetchStaticFont(DIGITAL_KHATT_INDOPAK_FONT_URL, 'Digital Khatt IndoPak');
}

export async function getSurahForPage(pageNumber: number): Promise<Surah | null> {
  const db = await getDatabase();
  // Get the primary surah on this page (the one with the most words)
  const row = await db.getFirstAsync<SurahRow>(
    `SELECT s.* FROM surahs s
     INNER JOIN (
       SELECT surah_number, COUNT(*) as cnt FROM mushaf_words
       WHERE page_number = ? GROUP BY surah_number ORDER BY cnt DESC LIMIT 1
     ) m ON s.number = m.surah_number`,
    [pageNumber]
  );
  return row ? mapSurahRow(row) : null;
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
  const row = await db.getFirstAsync<{ page_number: number }>(
    `SELECT MIN(mw.page_number) as page_number FROM mushaf_words mw
     INNER JOIN ayahs a ON mw.surah_number = a.surah_number AND mw.ayah_number = a.ayah_number
     WHERE a.juz_number = ?`,
    [juzNumber]
  );
  return row?.page_number ?? 1;
}

interface MarkerRow {
  line_number: number;
  juz_number: number;
  hizb_number: number;
  surah_number: number;
  ayah_number: number;
}

interface MarkerWithPrev extends MarkerRow {
  prev_juz_number: number | null;
  prev_hizb_number: number | null;
  quarter_pos: number;
}

export async function getPageMarkers(pageNumber: number): Promise<PageMarker[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MarkerWithPrev>(
    `SELECT
       MIN(mw.line_number) as line_number,
       a.juz_number, a.hizb_number,
       a.surah_number, a.ayah_number,
       (SELECT juz_number FROM ayahs
        WHERE (surah_number < a.surah_number OR (surah_number = a.surah_number AND ayah_number < a.ayah_number))
        ORDER BY surah_number DESC, ayah_number DESC LIMIT 1) as prev_juz_number,
       (SELECT hizb_number FROM ayahs
        WHERE (surah_number < a.surah_number OR (surah_number = a.surah_number AND ayah_number < a.ayah_number))
        ORDER BY surah_number DESC, ayah_number DESC LIMIT 1) as prev_hizb_number,
       (SELECT COUNT(*) FROM ayahs a2
        WHERE a2.hizb_number = a.hizb_number AND a2.text_uthmani LIKE '۞%'
        AND (a2.surah_number < a.surah_number OR (a2.surah_number = a.surah_number AND a2.ayah_number <= a.ayah_number))) as quarter_pos
     FROM ayahs a
     JOIN mushaf_words mw ON a.surah_number = mw.surah_number AND a.ayah_number = mw.ayah_number
     WHERE mw.page_number = ?
       AND mw.word_position = 1
       AND a.text_uthmani LIKE '۞%'
     GROUP BY a.surah_number, a.ayah_number
     ORDER BY line_number`,
    [pageNumber]
  );

  return rows.map((row) => {
    if (row.prev_juz_number !== null && row.prev_juz_number !== row.juz_number) {
      return { type: 'juz' as const, lineNumber: row.line_number, label: `الجزء ${toArabicIndic(row.juz_number)}` };
    }
    if (row.prev_hizb_number !== null && row.prev_hizb_number !== row.hizb_number) {
      return { type: 'hizb' as const, lineNumber: row.line_number, label: `الحزب ${toArabicIndic(row.hizb_number)}` };
    }
    return { type: 'quarter' as const, lineNumber: row.line_number, label: QUARTER_LABELS[row.quarter_pos] || 'الربع' };
  });
}

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

const ayahPreviewCache = new Map<string, string>();
const PREVIEW_CHAR_LIMIT = 80;

// Arabic combining diacritics (tashkeel): U+064B–U+0670 (tanwin/harakat/tatweel range),
// U+0671 shadda+vowel combos handled via the ranges below, and U+06D6–U+06ED (Quranic
// annotation marks). The regex covers U+064B–U+0670 and U+06D6–U+06ED.
const ARABIC_COMBINING_RE = /[ً-ٰۖ-ۭ]/;

/**
 * Truncates `text` to `limit` UTF-16 code units without leaving an orphaned
 * Arabic base letter whose combining mark was the first character past the cut.
 *
 * Two-pass logic:
 *  1. Walk the cut point back past any combining marks that fall right AFTER
 *     position `limit` (i.e. the dropped char is a mark → the last kept char
 *     would be an orphaned base → step back one more).
 *  2. Strip any trailing combining marks left inside the trimmed slice (handles
 *     the case where the cut lands mid-cluster from the other direction).
 */
function safeTruncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  let cut = limit;
  // If the first dropped character is a combining mark, the character just
  // before cut is its base letter — orphaned. Step back until the char at
  // `cut` is no longer a combining mark (or we reach the start).
  while (cut > 0 && ARABIC_COMBINING_RE.test(text[cut])) {
    cut--;
  }
  // Also remove any combining marks that are now trailing inside the slice.
  const sliced = text.slice(0, cut).replace(/[ً-ٰۖ-ۭ]+$/, '');
  return `${sliced}…`;
}

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
  const preview = safeTruncate(raw, PREVIEW_CHAR_LIMIT);
  ayahPreviewCache.set(key, preview);
  return preview;
}

/** @internal — for tests to reset the module-level ayah preview cache between runs. */
export function __resetAyahPreviewCacheForTests(): void {
  ayahPreviewCache.clear();
}

import { getDatabase } from './database';
import type { Surah, Ayah, Juz, MushafWord, MushafLine, PageMarker } from './types';
import {
  DEFAULT_MUSHAF_LAYOUT_ID,
  getMushafLayout,
  type MushafLayoutId,
} from './mushafLayouts';
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

export async function getJuzList(): Promise<Juz[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<JuzRow>('SELECT * FROM juz ORDER BY number');
  return rows.map(mapJuzRow);
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

export type MushafContentPackErrorCode = 'missing' | 'corrupt' | 'out_of_range';

export class MushafContentPackError extends Error {
  constructor(
    public readonly code: MushafContentPackErrorCode,
    public readonly layoutId: MushafLayoutId,
    message: string
  ) {
    super(message);
    this.name = 'MushafContentPackError';
  }
}

interface LayoutWordRow {
  source_word_id: number;
  canonical_word_key: string;
  surah_number: number;
  ayah_number: number;
  word_position: number;
  page_number: number;
  line_number: number;
  display_text: string;
  semantic_text: string;
  char_type: string;
}

interface LayoutLineRow {
  page_number: number;
  line_number: number;
  line_type: 'ayah' | 'surah_name' | 'basmallah' | 'empty';
  is_centered: number;
  surah_number: number | null;
}

export interface MushafLayoutManifest {
  layoutId: MushafLayoutId;
  sourceVersion: string;
  dataSha256: string;
  fontSha256: string;
  pageCount: number;
  linesPerPage: number;
  wordCount: number;
  ayahCount: number;
}

function assertPageInRange(layoutId: MushafLayoutId, pageNumber: number): void {
  const layout = getMushafLayout(layoutId);
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > layout.pageCount) {
    throw new MushafContentPackError(
      'out_of_range',
      layoutId,
      `Page ${pageNumber} is outside ${layout.displayName.en} (1-${layout.pageCount})`
    );
  }
}

function mapLayoutWord(row: LayoutWordRow): MushafWord {
  return {
    id: row.source_word_id,
    sourceWordId: row.source_word_id,
    canonicalWordKey: row.canonical_word_key,
    surahNumber: row.surah_number,
    ayahNumber: row.ayah_number,
    wordPosition: row.word_position,
    pageNumber: row.page_number,
    lineNumber: row.line_number,
    codeV2: row.display_text,
    semanticText: row.semantic_text,
    charType: row.char_type as MushafWord['charType'],
  };
}

export async function getLayoutWordsByPage(
  layoutId: MushafLayoutId,
  pageNumber: number
): Promise<MushafWord[]> {
  assertPageInRange(layoutId, pageNumber);
  const db = await getDatabase();
  if (layoutId === DEFAULT_MUSHAF_LAYOUT_ID) {
    const rows = await db.getAllAsync<MushafWordRow>(
      'SELECT * FROM mushaf_words WHERE page_number = ? ORDER BY line_number, id',
      [pageNumber]
    );
    return rows.map((row) => ({
      ...mapMushafWordRow(row),
      sourceWordId: row.id,
      canonicalWordKey: `${row.surah_number}:${row.ayah_number}:${row.word_position}`,
    }));
  }

  const rows = await db.getAllAsync<LayoutWordRow>(
    `SELECT source_word_id, canonical_word_key, surah_number, ayah_number,
            word_position, page_number, line_number, display_text,
            semantic_text, char_type
     FROM mushaf_layout_words
     WHERE layout_id = ? AND page_number = ?
     ORDER BY line_number, source_word_id`,
    [layoutId, pageNumber]
  );
  if (rows.length === 0) {
    throw new MushafContentPackError(
      'missing',
      layoutId,
      `The offline content pack has no data for page ${pageNumber}`
    );
  }
  return rows.map(mapLayoutWord);
}

export async function getLayoutLinesByPage(
  layoutId: MushafLayoutId,
  pageNumber: number
): Promise<MushafLine[]> {
  const words = await getLayoutWordsByPage(layoutId, pageNumber);
  const wordMap = new Map<number, MushafWord[]>();
  words.forEach((word) => wordMap.set(word.lineNumber, [...(wordMap.get(word.lineNumber) ?? []), word]));

  if (layoutId === DEFAULT_MUSHAF_LAYOUT_ID) {
    return Array.from({ length: getMushafLayout(layoutId).linesPerPage }, (_, index) => ({
      lineNumber: index + 1,
      words: wordMap.get(index + 1) ?? [],
      isCentered: false,
      lineType: wordMap.has(index + 1) ? 'ayah' : 'empty',
      surahNumber: null,
    }));
  }

  const db = await getDatabase();
  const rows = await db.getAllAsync<LayoutLineRow>(
    `SELECT page_number, line_number, line_type, is_centered, surah_number
     FROM mushaf_layout_lines
     WHERE layout_id = ? AND page_number = ?
     ORDER BY line_number`,
    [layoutId, pageNumber]
  );
  if (rows.length !== getMushafLayout(layoutId).linesPerPage) {
    throw new MushafContentPackError(
      'corrupt',
      layoutId,
      `The offline content pack has invalid line metadata for page ${pageNumber}`
    );
  }
  return rows.map((row) => ({
    lineNumber: row.line_number,
    words: wordMap.get(row.line_number) ?? [],
    isCentered: row.is_centered === 1,
    lineType: row.line_type,
    surahNumber: row.surah_number,
  }));
}

async function getQcfFont(pageNumber: number): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ font_data: string }>(
    'SELECT font_data FROM qcf_fonts WHERE page_number = ?',
    [pageNumber]
  );
  return row?.font_data ?? null;
}

export async function getMushafLayoutFont(
  layoutId: MushafLayoutId,
  pageNumber: number
): Promise<string> {
  assertPageInRange(layoutId, pageNumber);
  if (layoutId === DEFAULT_MUSHAF_LAYOUT_ID) {
    const font = await getQcfFont(pageNumber);
    if (!font) {
      throw new MushafContentPackError('missing', layoutId, `Missing QCF font for page ${pageNumber}`);
    }
    return font;
  }
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ data_base64: string }>(
    `SELECT data_base64 FROM mushaf_layout_assets
     WHERE layout_id = ? AND asset_key = 'primary-font'`,
    [layoutId]
  );
  if (!row?.data_base64) {
    throw new MushafContentPackError('missing', layoutId, 'The layout font is missing');
  }
  return row.data_base64;
}

export async function getMushafLayoutManifest(
  layoutId: MushafLayoutId
): Promise<MushafLayoutManifest | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    layout_id: MushafLayoutId;
    source_version: string;
    data_sha256: string;
    font_sha256: string;
    page_count: number;
    lines_per_page: number;
    word_count: number;
    ayah_count: number;
  }>('SELECT * FROM mushaf_layout_manifests WHERE layout_id = ?', [layoutId]);
  return row
    ? {
        layoutId: row.layout_id,
        sourceVersion: row.source_version,
        dataSha256: row.data_sha256,
        fontSha256: row.font_sha256,
        pageCount: row.page_count,
        linesPerPage: row.lines_per_page,
        wordCount: row.word_count,
        ayahCount: row.ayah_count,
      }
    : null;
}

const verifiedPacks = new Map<MushafLayoutId, Promise<void>>();

export function assertMushafLayoutAvailable(layoutId: MushafLayoutId): Promise<void> {
  const cached = verifiedPacks.get(layoutId);
  if (cached) return cached;
  const verification = (async () => {
    const db = await getDatabase();
    const descriptor = getMushafLayout(layoutId);
    const manifest = await getMushafLayoutManifest(layoutId);
    if (layoutId === DEFAULT_MUSHAF_LAYOUT_ID) {
      const [words, pages, fonts] = await Promise.all([
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM mushaf_words'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(DISTINCT page_number) as count FROM mushaf_words'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM qcf_fonts'),
      ]);
      if (
        words?.count !== descriptor.expected.wordCount ||
        pages?.count !== descriptor.pageCount ||
        fonts?.count !== descriptor.pageCount ||
        manifest?.sourceVersion !== descriptor.dataVersion ||
        manifest.dataSha256 !== descriptor.expected.dataSha256 ||
        manifest.fontSha256 !== descriptor.expected.fontSha256 ||
        manifest.pageCount !== descriptor.pageCount ||
        manifest.linesPerPage !== descriptor.linesPerPage ||
        manifest.wordCount !== descriptor.expected.wordCount ||
        manifest.ayahCount !== descriptor.expected.ayahCount
      ) {
        throw new MushafContentPackError('corrupt', layoutId, 'The Madani content pack failed integrity checks');
      }
      return;
    }
    if (!manifest) {
      throw new MushafContentPackError('missing', layoutId, 'The selected layout pack is not installed');
    }
    const [wordCounts, lineCounts, fontAsset, finalLocation] = await Promise.all([
      db.getFirstAsync<{ words: number; pages: number; ayahs: number; keys: number }>(
        `SELECT COUNT(*) AS words, COUNT(DISTINCT page_number) AS pages,
                COUNT(DISTINCT surah_number || ':' || ayah_number) AS ayahs,
                COUNT(DISTINCT canonical_word_key) AS keys
         FROM mushaf_layout_words WHERE layout_id = ?`,
        [layoutId]
      ),
      db.getFirstAsync<{ lines: number; pages: number }>(
        `SELECT COUNT(*) AS lines, COUNT(DISTINCT page_number) AS pages
         FROM mushaf_layout_lines WHERE layout_id = ?`,
        [layoutId]
      ),
      db.getFirstAsync<{ sha256: string; bytes: number }>(
        `SELECT sha256, LENGTH(data_base64) AS bytes FROM mushaf_layout_assets
         WHERE layout_id = ? AND asset_key = 'primary-font'`,
        [layoutId]
      ),
      db.getFirstAsync<{ page: number }>(
        `SELECT MAX(page_number) AS page FROM mushaf_layout_words
         WHERE layout_id = ? AND surah_number = 114 AND ayah_number = 6`,
        [layoutId]
      ),
    ]);
    if (
      manifest.sourceVersion !== descriptor.dataVersion ||
      manifest.pageCount !== descriptor.pageCount ||
      manifest.linesPerPage !== descriptor.linesPerPage ||
      manifest.wordCount !== descriptor.expected.wordCount ||
      manifest.ayahCount !== descriptor.expected.ayahCount ||
      manifest.dataSha256 !== descriptor.expected.dataSha256 ||
      manifest.fontSha256 !== descriptor.expected.fontSha256 ||
      wordCounts?.words !== descriptor.expected.wordCount ||
      wordCounts.pages !== descriptor.pageCount ||
      wordCounts.ayahs !== descriptor.expected.ayahCount ||
      wordCounts.keys !== descriptor.expected.wordCount ||
      lineCounts?.lines !== descriptor.pageCount * descriptor.linesPerPage ||
      lineCounts.pages !== descriptor.pageCount ||
      fontAsset?.sha256 !== descriptor.expected.fontSha256 ||
      !fontAsset.bytes ||
      finalLocation?.page !== descriptor.pageCount
    ) {
      throw new MushafContentPackError('corrupt', layoutId, 'The selected layout pack failed integrity checks');
    }
  })();
  verifiedPacks.set(layoutId, verification);
  verification.catch(() => verifiedPacks.delete(layoutId));
  return verification;
}

function layoutWordTable(layoutId: MushafLayoutId): string {
  return layoutId === DEFAULT_MUSHAF_LAYOUT_ID ? 'mushaf_words' : 'mushaf_layout_words';
}

function layoutFilter(layoutId: MushafLayoutId): { sql: string; params: (string | number)[] } {
  return layoutId === DEFAULT_MUSHAF_LAYOUT_ID
    ? { sql: '', params: [] }
    : { sql: 'layout_id = ? AND ', params: [layoutId] };
}

export async function getMushafPageForAyah(
  layoutId: MushafLayoutId,
  surahNumber: number,
  ayahNumber: number
): Promise<number> {
  const db = await getDatabase();
  const table = layoutWordTable(layoutId);
  const filter = layoutFilter(layoutId);
  const row = await db.getFirstAsync<{ page_number: number }>(
    `SELECT MIN(page_number) as page_number FROM ${table}
     WHERE ${filter.sql}surah_number = ? AND ayah_number = ?`,
    [...filter.params, surahNumber, ayahNumber]
  );
  if (!row?.page_number) {
    throw new MushafContentPackError(
      'corrupt',
      layoutId,
      `No page maps to Quran location ${surahNumber}:${ayahNumber}`
    );
  }
  return row.page_number;
}

export async function getMushafTopAyahForPage(
  layoutId: MushafLayoutId,
  pageNumber: number
): Promise<{ surahNumber: number; ayahNumber: number; wordPosition: number }> {
  assertPageInRange(layoutId, pageNumber);
  const db = await getDatabase();
  const table = layoutWordTable(layoutId);
  const filter = layoutFilter(layoutId);
  const orderColumn = layoutId === DEFAULT_MUSHAF_LAYOUT_ID ? 'id' : 'source_word_id';
  const row = await db.getFirstAsync<{
    surah_number: number;
    ayah_number: number;
    word_position: number;
  }>(
    `SELECT surah_number, ayah_number, word_position FROM ${table}
     WHERE ${filter.sql}page_number = ? AND char_type != 'end'
     ORDER BY line_number, ${orderColumn} LIMIT 1`,
    [...filter.params, pageNumber]
  );
  if (!row) {
    throw new MushafContentPackError('corrupt', layoutId, `Page ${pageNumber} contains no Quran text`);
  }
  return {
    surahNumber: row.surah_number,
    ayahNumber: row.ayah_number,
    wordPosition: row.word_position,
  };
}

export async function getMushafPageForSurah(
  layoutId: MushafLayoutId,
  surahNumber: number
): Promise<number> {
  return getMushafPageForAyah(layoutId, surahNumber, 1);
}

export async function getMushafPageForJuz(
  layoutId: MushafLayoutId,
  juzNumber: number
): Promise<number> {
  const db = await getDatabase();
  const juz = await db.getFirstAsync<{ start_surah: number; start_ayah: number }>(
    'SELECT start_surah, start_ayah FROM juz WHERE number = ?',
    [juzNumber]
  );
  if (!juz) throw new Error(`Juz ${juzNumber} not found`);
  return getMushafPageForAyah(layoutId, juz.start_surah, juz.start_ayah);
}

export async function getMushafSurahForPage(
  layoutId: MushafLayoutId,
  pageNumber: number
): Promise<Surah | null> {
  const top = await getMushafTopAyahForPage(layoutId, pageNumber);
  return getSurahByNumber(top.surahNumber);
}

export async function getMushafJuzAndPageForAyah(
  layoutId: MushafLayoutId,
  surahNumber: number,
  ayahNumber: number
): Promise<{ juz: number; page: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ juz_number: number }>(
    'SELECT juz_number FROM ayahs WHERE surah_number = ? AND ayah_number = ?',
    [surahNumber, ayahNumber]
  );
  if (!row) throw new Error(`No juz found for surah ${surahNumber}, ayah ${ayahNumber}`);
  return {
    juz: row.juz_number,
    page: await getMushafPageForAyah(layoutId, surahNumber, ayahNumber),
  };
}

export async function getSemanticAyahsForMushafPage(
  layoutId: MushafLayoutId,
  pageNumber: number
): Promise<Ayah[]> {
  const db = await getDatabase();
  const table = layoutWordTable(layoutId);
  const filter = layoutFilter(layoutId);
  const rows = await db.getAllAsync<AyahRow>(
    `SELECT a.* FROM ayahs a
     INNER JOIN (
       SELECT surah_number, ayah_number, MIN(line_number) as first_line
       FROM ${table}
       WHERE ${filter.sql}page_number = ?
       GROUP BY surah_number, ayah_number
     ) p ON p.surah_number = a.surah_number AND p.ayah_number = a.ayah_number
     ORDER BY p.first_line, a.surah_number, a.ayah_number`,
    [...filter.params, pageNumber]
  );
  return rows.map(mapAyahRow);
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

const layoutPageMapCache = new Map<MushafLayoutId, Map<string, number>>();

/**
 * Page number of every ayah in one layout, keyed `surah:ayah`. The `ayahs` table
 * only carries Madani pages, so a search result printed a Madani page while the
 * reader opened the selected layout's page.
 */
async function loadLayoutPageMap(layoutId: MushafLayoutId): Promise<Map<string, number>> {
  const cached = layoutPageMapCache.get(layoutId);
  if (cached) return cached;
  const db = await getDatabase();
  const table = layoutWordTable(layoutId);
  const filter = layoutFilter(layoutId);
  const rows = await db.getAllAsync<{
    surah_number: number;
    ayah_number: number;
    page_number: number;
  }>(
    `SELECT surah_number, ayah_number, MIN(page_number) as page_number FROM ${table}
     WHERE ${filter.sql}1 = 1 GROUP BY surah_number, ayah_number`,
    filter.params
  );
  const map = new Map(
    rows.map((row) => [`${row.surah_number}:${row.ayah_number}`, row.page_number])
  );
  layoutPageMapCache.set(layoutId, map);
  return map;
}

export async function searchAyahs(
  query: string,
  limit?: number,
  layoutId: MushafLayoutId = DEFAULT_MUSHAF_LAYOUT_ID
): Promise<AyahSearchResult[]> {
  const needle = normalizeForSearch(query);
  if (!needle) return [];
  const cache = await loadAyahSearchCache();
  // The default layout's pages are the ones stored on `ayahs`, so it needs no map.
  const pageMap =
    layoutId === DEFAULT_MUSHAF_LAYOUT_ID ? null : await loadLayoutPageMap(layoutId);
  const out: AyahSearchResult[] = [];
  for (const row of cache) {
    if (row.normalized.includes(needle)) {
      out.push({
        surahNumber: row.surahNumber,
        ayahNumber: row.ayahNumber,
        textUthmani: row.textUthmani,
        juzNumber: row.juzNumber,
        pageNumber: pageMap?.get(`${row.surahNumber}:${row.ayahNumber}`) ?? row.pageNumber,
      });
      if (limit !== undefined && out.length >= limit) break;
    }
  }
  return out;
}

/** @internal - for tests to reset the module-level caches between runs. */
export function __resetAyahSearchCacheForTests(): void {
  ayahSearchCache = null;
  layoutPageMapCache.clear();
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

export async function getAyahPreview(
  surahNumber: number,
  ayahNumber: number,
  charLimit: number = PREVIEW_CHAR_LIMIT
): Promise<string> {
  const key = `${surahNumber}:${ayahNumber}:${charLimit}`;
  const cached = ayahPreviewCache.get(key);
  if (cached !== undefined) return cached;

  const db = await getDatabase();
  const rows = await db.getAllAsync<{ text_uthmani: string }>(
    'SELECT text_uthmani FROM ayahs WHERE surah_number = ? AND ayah_number = ? LIMIT 1',
    [surahNumber, ayahNumber]
  );
  const raw = rows[0]?.text_uthmani ?? '';
  const preview = safeTruncate(raw, charLimit);
  ayahPreviewCache.set(key, preview);
  return preview;
}

/** @internal - for tests to reset the module-level ayah preview cache between runs. */
export function __resetAyahPreviewCacheForTests(): void {
  ayahPreviewCache.clear();
}

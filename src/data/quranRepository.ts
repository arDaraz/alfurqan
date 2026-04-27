import { getDatabase } from './database';
import type { Surah, Ayah, Juz, MushafWord, PageMarker } from './types';
import { toArabicIndic } from '../utils/arabic';
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

// TODO: Currently fetches within a single surah. Add cross-surah support when
// the selection UI allows spanning across surah boundaries.
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
  code_v2: string;
  char_type: string;
}

function mapMushafWordRow(r: MushafWordRow): MushafWord {
  return {
    id: r.id,
    surahNumber: r.surah_number,
    ayahNumber: r.ayah_number,
    wordPosition: r.word_position,
    pageNumber: r.page_number,
    lineNumber: r.line_number,
    codeV2: r.code_v2,
    charType: r.char_type as 'word' | 'end' | 'pause',
  };
}

export async function getWordsByPage(pageNumber: number): Promise<MushafWord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MushafWordRow>(
    'SELECT * FROM mushaf_words WHERE page_number = ? ORDER BY line_number, id',
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

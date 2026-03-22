import { getDatabase } from './database';
import type { Surah, Ayah, Juz } from './types';

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

/**
 * Build-time script to generate the Quran SQLite database.
 *
 * Fetches data from the Quran Foundation API v4 and populates a SQLite database
 * at assets/db/quran.db with surah metadata, ayah text (Uthmani with diacritics),
 * and juz boundary data.
 *
 * Usage: npx tsx src/data/seed/buildQuranDb.ts
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.resolve(__dirname, '../../../assets/db/quran.db');
const API_BASE = 'https://api.quran.com/api/v4';

// Rate limiting
const DELAY_MS = 150;
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface QuranApiChapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_arabic: string;
  name_simple: string;
  translated_name: { name: string };
  verses_count: number;
}

interface QuranApiVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  hizb_number: number;
  juz_number: number;
  page_number: number;
  chapter_id: number;
}

interface QuranApiJuz {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>;
  first_verse_id: number;
  last_verse_id: number;
}

interface PaginatedVerseResponse {
  verses: QuranApiVerse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  return response.json() as Promise<T>;
}

/** Fetch all ayahs for a surah, handling pagination */
async function fetchAllVersesBySurah(surahNumber: number): Promise<QuranApiVerse[]> {
  const allVerses: QuranApiVerse[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${API_BASE}/verses/by_chapter/${surahNumber}?language=en&per_page=50&page=${page}&fields=text_uthmani,chapter_id,verse_number,juz_number,hizb_number,page_number`;
    const response = await fetchJson<PaginatedVerseResponse>(url);
    allVerses.push(...response.verses);
    totalPages = response.pagination.total_pages;
    page++;

    if (page <= totalPages) {
      await delay(DELAY_MS);
    }
  }

  return allVerses;
}

async function main() {
  console.log('Building Quran database...');

  // Ensure output directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Remove existing database
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE surahs (
      number INTEGER PRIMARY KEY,
      name_arabic TEXT NOT NULL,
      name_english TEXT NOT NULL,
      ayah_count INTEGER NOT NULL,
      revelation_type TEXT NOT NULL,
      revelation_order INTEGER NOT NULL,
      juz_start INTEGER NOT NULL
    );

    CREATE TABLE ayahs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surah_number INTEGER NOT NULL,
      ayah_number INTEGER NOT NULL,
      text_uthmani TEXT NOT NULL,
      juz_number INTEGER NOT NULL,
      hizb_number INTEGER NOT NULL,
      page_number INTEGER NOT NULL,
      FOREIGN KEY (surah_number) REFERENCES surahs(number)
    );

    CREATE TABLE juz (
      number INTEGER PRIMARY KEY,
      start_surah INTEGER NOT NULL,
      start_ayah INTEGER NOT NULL,
      end_surah INTEGER NOT NULL,
      end_ayah INTEGER NOT NULL,
      FOREIGN KEY (start_surah) REFERENCES surahs(number),
      FOREIGN KEY (end_surah) REFERENCES surahs(number)
    );

    CREATE INDEX idx_ayahs_surah ON ayahs(surah_number);
    CREATE INDEX idx_ayahs_juz ON ayahs(juz_number);
    CREATE INDEX idx_ayahs_surah_ayah ON ayahs(surah_number, ayah_number);
  `);

  // Step 1: Fetch surah metadata
  console.log('Fetching surah metadata...');
  const chaptersResponse = await fetchJson<{ chapters: QuranApiChapter[] }>(
    `${API_BASE}/chapters`
  );
  const chapters = chaptersResponse.chapters;
  console.log(`  Received ${chapters.length} chapters`);

  // Step 2: Insert surah metadata first (needed for foreign key on ayahs)
  // We insert with juz_start=1 as placeholder, then update after fetching ayahs
  console.log('Inserting surah metadata...');
  const insertSurah = db.prepare(
    'INSERT INTO surahs (number, name_arabic, name_english, ayah_count, revelation_type, revelation_order, juz_start) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const insertSurahs = db.transaction((chapters: QuranApiChapter[]) => {
    for (const chapter of chapters) {
      const revelationType = chapter.revelation_place === 'makkah' ? 'Makki' : 'Madani';
      insertSurah.run(
        chapter.id,
        chapter.name_arabic,
        chapter.name_simple,
        chapter.verses_count,
        revelationType,
        chapter.revelation_order,
        1 // placeholder juz_start, updated below
      );
    }
  });

  insertSurahs(chapters);
  console.log(`  Inserted ${chapters.length} surahs`);

  // Step 3: Fetch all ayah text per surah using /verses/by_chapter endpoint
  console.log('Fetching ayah text for all 114 surahs...');
  const insertAyah = db.prepare(
    'INSERT INTO ayahs (surah_number, ayah_number, text_uthmani, juz_number, hizb_number, page_number) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const updateJuzStart = db.prepare('UPDATE surahs SET juz_start = ? WHERE number = ?');

  let totalAyahsInserted = 0;

  for (const chapter of chapters) {
    const surahNumber = chapter.id;
    process.stdout.write(`  Surah ${surahNumber}/114: ${chapter.name_simple}...`);

    const verses = await fetchAllVersesBySurah(surahNumber);

    const insertMany = db.transaction((verses: QuranApiVerse[]) => {
      let juzStart: number | null = null;
      for (const verse of verses) {
        insertAyah.run(
          surahNumber,
          verse.verse_number,
          verse.text_uthmani,
          verse.juz_number,
          verse.hizb_number,
          verse.page_number
        );

        // Track first juz for this surah
        if (juzStart === null) {
          juzStart = verse.juz_number;
        }
      }
      // Update surah's juz_start
      if (juzStart !== null) {
        updateJuzStart.run(juzStart, surahNumber);
      }
    });

    insertMany(verses);
    totalAyahsInserted += verses.length;
    console.log(` ${verses.length} ayahs`);

    await delay(DELAY_MS);
  }

  // Step 4: Fetch and insert juz data
  console.log('Fetching juz data...');
  const juzsResponse = await fetchJson<{ juzs: QuranApiJuz[] }>(`${API_BASE}/juzs`);
  const juzs = juzsResponse.juzs;

  const insertJuz = db.prepare(
    'INSERT OR IGNORE INTO juz (number, start_surah, start_ayah, end_surah, end_ayah) VALUES (?, ?, ?, ?, ?)'
  );

  const insertJuzs = db.transaction((juzs: QuranApiJuz[]) => {
    for (const juz of juzs) {
      const mapping = juz.verse_mapping;
      const surahNumbers = Object.keys(mapping).map(Number).sort((a, b) => a - b);

      const startSurah = surahNumbers[0];
      const endSurah = surahNumbers[surahNumbers.length - 1];

      const startRange = mapping[startSurah.toString()];
      const endRange = mapping[endSurah.toString()];

      const startAyah = parseInt(startRange.split('-')[0], 10);
      const endAyah = parseInt(endRange.split('-').pop()!, 10);

      insertJuz.run(juz.juz_number, startSurah, startAyah, endSurah, endAyah);
    }
  });

  insertJuzs(juzs);
  console.log(`  Inserted ${juzs.length} juz entries`);

  // Step 5: Integrity checks
  console.log('\nRunning integrity checks...');

  const surahCount = db.prepare('SELECT COUNT(*) as c FROM surahs').get() as { c: number };
  console.log(`  Surahs: ${surahCount.c} (expected 114)`);
  if (surahCount.c !== 114) throw new Error(`Expected 114 surahs, got ${surahCount.c}`);

  const ayahCount = db.prepare('SELECT COUNT(*) as c FROM ayahs').get() as { c: number };
  console.log(`  Ayahs: ${ayahCount.c} (expected 6236)`);
  if (ayahCount.c !== 6236) throw new Error(`Expected 6236 ayahs, got ${ayahCount.c}`);

  const fatihaCount = db.prepare('SELECT COUNT(*) as c FROM ayahs WHERE surah_number = 1').get() as { c: number };
  console.log(`  Al-Fatiha ayahs: ${fatihaCount.c} (expected 7)`);
  if (fatihaCount.c !== 7) throw new Error(`Expected 7 ayahs for Al-Fatiha, got ${fatihaCount.c}`);

  const baqarahCount = db.prepare('SELECT COUNT(*) as c FROM ayahs WHERE surah_number = 2').get() as { c: number };
  console.log(`  Al-Baqarah ayahs: ${baqarahCount.c} (expected 286)`);
  if (baqarahCount.c !== 286) throw new Error(`Expected 286 ayahs for Al-Baqarah, got ${baqarahCount.c}`);

  const nasCount = db.prepare('SELECT COUNT(*) as c FROM ayahs WHERE surah_number = 114').get() as { c: number };
  console.log(`  An-Nas ayahs: ${nasCount.c} (expected 6)`);
  if (nasCount.c !== 6) throw new Error(`Expected 6 ayahs for An-Nas, got ${nasCount.c}`);

  const emptyText = db.prepare("SELECT COUNT(*) as c FROM ayahs WHERE text_uthmani IS NULL OR text_uthmani = ''").get() as { c: number };
  console.log(`  Empty text_uthmani: ${emptyText.c} (expected 0)`);
  if (emptyText.c > 0) throw new Error(`Found ${emptyText.c} ayahs with empty text`);

  const emptyJuz = db.prepare('SELECT COUNT(*) as c FROM ayahs WHERE juz_number IS NULL OR juz_number = 0').get() as { c: number };
  console.log(`  Empty juz_number: ${emptyJuz.c} (expected 0)`);
  if (emptyJuz.c > 0) throw new Error(`Found ${emptyJuz.c} ayahs with empty juz_number`);

  const juzCount = db.prepare('SELECT COUNT(*) as c FROM juz').get() as { c: number };
  console.log(`  Juz entries: ${juzCount.c} (expected 30)`);
  if (juzCount.c !== 30) throw new Error(`Expected 30 juz entries, got ${juzCount.c}`);

  db.close();

  const stats = fs.statSync(DB_PATH);
  console.log(`\nDatabase built successfully at: ${DB_PATH}`);
  console.log(`Database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('All integrity checks passed!');
}

main().catch((error) => {
  console.error('Failed to build Quran database:', error);
  process.exit(1);
});

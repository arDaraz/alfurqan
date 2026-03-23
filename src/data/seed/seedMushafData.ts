/**
 * Build-time script to seed Mushaf QCF data into the existing Quran database.
 *
 * Adds mushaf_words table (~77,000 rows) and qcf_fonts table (604 rows)
 * to the existing quran.db.
 *
 * Usage: npx tsx src/data/seed/seedMushafData.ts
 */
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.resolve(__dirname, '../../../assets/db/quran.db');
const API_BASE = 'https://api.quran.com/api/v4';
const FONT_CDN = 'https://static.qurancdn.com/fonts/quran/hafs/v2/woff2';
const TOTAL_PAGES = 604;
const DELAY_MS = 100; // Rate limiting between API calls

// Rate limiting
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

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  return response.arrayBuffer();
}

// API types
interface QcfWordData {
  id: number;
  position: number;
  char_type_name: string; // "word", "end", "pause"
  code_v2: string;
  line_number: number;
  page_number: number;
  verse_key: string; // "surah:ayah"
}

interface QcfPageResponse {
  verses: Array<{
    id: number;
    verse_key: string;
    words: QcfWordData[];
  }>;
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
  };
}

async function main() {
  console.log('Seeding Mushaf QCF data...');

  // Step 1: Verify existing database exists
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      `Database not found at ${DB_PATH}. Run "npm run seed" (buildQuranDb.ts) first.`
    );
  }

  const statsBefore = fs.statSync(DB_PATH);
  console.log(`Existing database size: ${(statsBefore.size / 1024 / 1024).toFixed(2)} MB`);

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Step 2: Create tables (idempotent)
  console.log('Creating mushaf tables...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS mushaf_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surah_number INTEGER NOT NULL,
      ayah_number INTEGER NOT NULL,
      word_position INTEGER NOT NULL,
      page_number INTEGER NOT NULL,
      line_number INTEGER NOT NULL,
      code_v2 TEXT NOT NULL,
      char_type TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_mushaf_words_page ON mushaf_words(page_number);
    CREATE INDEX IF NOT EXISTS idx_mushaf_words_page_line ON mushaf_words(page_number, line_number);

    CREATE TABLE IF NOT EXISTS qcf_fonts (
      page_number INTEGER PRIMARY KEY,
      font_data TEXT NOT NULL
    );
  `);

  // Step 3: Clear existing data (for re-runnability)
  console.log('Clearing existing mushaf data...');
  db.exec('DELETE FROM mushaf_words;');
  db.exec('DELETE FROM qcf_fonts;');

  // Step 4: Fetch words for all 604 pages
  console.log(`Fetching words for ${TOTAL_PAGES} pages...`);
  const insertWord = db.prepare(
    'INSERT INTO mushaf_words (surah_number, ayah_number, word_position, page_number, line_number, code_v2, char_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  let totalWordsInserted = 0;

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    let apiPage = 1;
    let hasMore = true;
    let pageWordCount = 0;

    const insertPageWords = db.transaction(
      (
        words: Array<{
          surah: number;
          ayah: number;
          position: number;
          page: number;
          line: number;
          codeV2: string;
          charType: string;
        }>
      ) => {
        for (const w of words) {
          insertWord.run(w.surah, w.ayah, w.position, w.page, w.line, w.codeV2, w.charType);
        }
      }
    );

    const wordsToInsert: Array<{
      surah: number;
      ayah: number;
      position: number;
      page: number;
      line: number;
      codeV2: string;
      charType: string;
    }> = [];

    while (hasMore) {
      const url = `${API_BASE}/verses/by_page/${page}?words=true&per_page=50&page=${apiPage}&word_fields=code_v2,line_number,page_number&fields=verse_key`;
      const response = await fetchJson<QcfPageResponse>(url);

      for (const verse of response.verses) {
        const [surahStr, ayahStr] = verse.verse_key.split(':');
        const surah = Number(surahStr);
        const ayah = Number(ayahStr);

        for (const word of verse.words) {
          wordsToInsert.push({
            surah,
            ayah,
            position: word.position,
            page: word.page_number,
            line: word.line_number,
            codeV2: word.code_v2,
            charType: word.char_type_name,
          });
          pageWordCount++;
        }
      }

      hasMore = response.pagination.next_page !== null;
      apiPage++;
    }

    insertPageWords(wordsToInsert);
    totalWordsInserted += pageWordCount;

    if (page % 50 === 0 || page === 1 || page === TOTAL_PAGES) {
      console.log(`  Page ${page}/${TOTAL_PAGES}: ${pageWordCount} words (total: ${totalWordsInserted})`);
    }

    await delay(DELAY_MS);
  }

  console.log(`Total words inserted: ${totalWordsInserted}`);

  // Step 5: Fetch QCF v2 fonts for all 604 pages
  console.log(`\nFetching QCF v2 fonts for ${TOTAL_PAGES} pages...`);
  const insertFont = db.prepare('INSERT INTO qcf_fonts (page_number, font_data) VALUES (?, ?)');

  let fontsInserted = 0;
  const FONT_BATCH_SIZE = 50;

  for (let batchStart = 1; batchStart <= TOTAL_PAGES; batchStart += FONT_BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + FONT_BATCH_SIZE - 1, TOTAL_PAGES);
    const fontBatch: Array<{ page: number; base64: string }> = [];

    for (let page = batchStart; page <= batchEnd; page++) {
      const url = `${FONT_CDN}/p${page}.woff2`;
      const arrayBuffer = await fetchArrayBuffer(url);
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      fontBatch.push({ page, base64 });
      fontsInserted++;

      if (fontsInserted % 50 === 0 || fontsInserted === 1 || fontsInserted === TOTAL_PAGES) {
        console.log(`  Font ${fontsInserted}/${TOTAL_PAGES}`);
      }

      await delay(DELAY_MS);
    }

    // Batch insert fonts
    const insertFonts = db.transaction(
      (batch: Array<{ page: number; base64: string }>) => {
        for (const item of batch) {
          insertFont.run(item.page, item.base64);
        }
      }
    );
    insertFonts(fontBatch);
  }

  console.log(`Total fonts inserted: ${fontsInserted}`);

  // Step 6: Integrity checks
  console.log('\nRunning integrity checks...');

  const wordCount = db.prepare('SELECT COUNT(*) as c FROM mushaf_words').get() as { c: number };
  console.log(`  mushaf_words count: ${wordCount.c} (expected ~77,000-84,000)`);
  if (wordCount.c < 75000 || wordCount.c > 90000) {
    throw new Error(`Expected 75,000-90,000 words, got ${wordCount.c}`);
  }

  const fontCount = db.prepare('SELECT COUNT(*) as c FROM qcf_fonts').get() as { c: number };
  console.log(`  qcf_fonts count: ${fontCount.c} (expected 604)`);
  if (fontCount.c !== 604) {
    throw new Error(`Expected 604 fonts, got ${fontCount.c}`);
  }

  const distinctPages = db.prepare('SELECT COUNT(DISTINCT page_number) as c FROM mushaf_words').get() as {
    c: number;
  };
  console.log(`  Distinct pages with words: ${distinctPages.c} (expected 604)`);
  if (distinctPages.c !== 604) {
    throw new Error(`Expected 604 distinct pages, got ${distinctPages.c}`);
  }

  const fontPages = db.prepare('SELECT COUNT(*) as c FROM qcf_fonts').get() as { c: number };
  console.log(`  Font pages: ${fontPages.c} (expected 604)`);
  if (fontPages.c !== 604) {
    throw new Error(`Expected 604 font pages, got ${fontPages.c}`);
  }

  // Verify page 1 (Al-Fatiha) has words with line_number values
  const page1Lines = db.prepare(
    'SELECT COUNT(DISTINCT line_number) as c FROM mushaf_words WHERE page_number = 1'
  ).get() as { c: number };
  console.log(`  Page 1 distinct lines: ${page1Lines.c} (expected > 0)`);
  if (page1Lines.c === 0) {
    throw new Error('Page 1 has no distinct line_number values');
  }

  // No empty code_v2 values
  const emptyCode = db.prepare(
    "SELECT COUNT(*) as c FROM mushaf_words WHERE code_v2 IS NULL OR code_v2 = ''"
  ).get() as { c: number };
  console.log(`  Empty code_v2 values: ${emptyCode.c} (expected 0)`);
  if (emptyCode.c > 0) {
    throw new Error(`Found ${emptyCode.c} words with empty code_v2`);
  }

  // Step 7: Print database size change and close
  db.close();

  const statsAfter = fs.statSync(DB_PATH);
  console.log(`\nDatabase size: ${(statsBefore.size / 1024 / 1024).toFixed(2)} MB -> ${(statsAfter.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Size increase: ${((statsAfter.size - statsBefore.size) / 1024 / 1024).toFixed(2)} MB`);
  console.log('All integrity checks passed!');
  console.log('Mushaf data seeded successfully.');
}

main().catch((error) => {
  console.error('Failed to seed Mushaf data:', error);
  process.exit(1);
});

/**
 * Build-time script to seed Mushaf QCF data into the existing Quran database.
 *
 * Adds mushaf_words table (~77,000 rows), indopak_words table (~77,000 rows),
 * qcf_fonts table (604 rows),
 * qcf_v1_fonts table (604 rows), and qcf_v4_fonts table (604 rows)
 * to the existing quran.db.
 *
 * Usage: npx tsx src/data/seed/seedMushafData.ts
 */
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.resolve(__dirname, '../../../assets/db/quran.db');
const API_BASE = 'https://api.quran.com/api/v4';
const FONT_CDN_V1 = 'https://verses.quran.foundation/fonts/quran/hafs/v1/woff2';
const FONT_CDN_V2 = 'https://static.qurancdn.com/fonts/quran/hafs/v2/woff2';
const FONT_CDN_V4 = 'https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2';
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
  code_v1: string;
  code_v2: string;
  line_number: number;
  page_number: number;
  verse_key: string; // "surah:ayah"
}

interface IndopakWordData {
  id: number;
  position: number;
  char_type_name: string; // "word", "end", "pause"
  text_indopak: string;
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

interface IndopakPageResponse {
  verses: Array<{
    id: number;
    verse_key: string;
    words: IndopakWordData[];
  }>;
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
  };
}

function hasColumn(db: Database.Database, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

async function seedFonts(
  db: Database.Database,
  tableName: string,
  cdnBase: string,
  label: string
): Promise<number> {
  console.log(`\nFetching ${label} fonts for ${TOTAL_PAGES} pages...`);
  const insertFont = db.prepare(`INSERT INTO ${tableName} (page_number, font_data) VALUES (?, ?)`);

  let fontsInserted = 0;
  const FONT_BATCH_SIZE = 50;

  for (let batchStart = 1; batchStart <= TOTAL_PAGES; batchStart += FONT_BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + FONT_BATCH_SIZE - 1, TOTAL_PAGES);
    const fontBatch: Array<{ page: number; base64: string }> = [];

    for (let page = batchStart; page <= batchEnd; page++) {
      const url = `${cdnBase}/p${page}.woff2`;
      const arrayBuffer = await fetchArrayBuffer(url);
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      fontBatch.push({ page, base64 });
      fontsInserted++;

      if (fontsInserted % 50 === 0 || fontsInserted === 1 || fontsInserted === TOTAL_PAGES) {
        console.log(`  ${label} font ${fontsInserted}/${TOTAL_PAGES}`);
      }

      await delay(DELAY_MS);
    }

    const insertFonts = db.transaction(
      (batch: Array<{ page: number; base64: string }>) => {
        for (const item of batch) {
          insertFont.run(item.page, item.base64);
        }
      }
    );
    insertFonts(fontBatch);
  }

  console.log(`Total ${label} fonts inserted: ${fontsInserted}`);
  return fontsInserted;
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
      code_v1 TEXT,
      code_v2 TEXT NOT NULL,
      char_type TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_mushaf_words_page ON mushaf_words(page_number);
    CREATE INDEX IF NOT EXISTS idx_mushaf_words_page_line ON mushaf_words(page_number, line_number);

    CREATE TABLE IF NOT EXISTS indopak_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surah_number INTEGER NOT NULL,
      ayah_number INTEGER NOT NULL,
      word_position INTEGER NOT NULL,
      page_number INTEGER NOT NULL,
      line_number INTEGER NOT NULL,
      text_indopak TEXT NOT NULL,
      char_type TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_indopak_words_page ON indopak_words(page_number);
    CREATE INDEX IF NOT EXISTS idx_indopak_words_page_line ON indopak_words(page_number, line_number);

    CREATE TABLE IF NOT EXISTS qcf_fonts (
      page_number INTEGER PRIMARY KEY,
      font_data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS qcf_v1_fonts (
      page_number INTEGER PRIMARY KEY,
      font_data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS qcf_v4_fonts (
      page_number INTEGER PRIMARY KEY,
      font_data TEXT NOT NULL
    );
  `);

  if (!hasColumn(db, 'mushaf_words', 'code_v1')) {
    db.exec('ALTER TABLE mushaf_words ADD COLUMN code_v1 TEXT;');
  }

  // Step 3: Clear existing data (for re-runnability)
  console.log('Clearing existing mushaf data...');
  db.exec('DELETE FROM mushaf_words;');
  db.exec('DELETE FROM indopak_words;');
  db.exec('DELETE FROM qcf_fonts;');
  db.exec('DELETE FROM qcf_v1_fonts;');
  db.exec('DELETE FROM qcf_v4_fonts;');

  // Step 4: Fetch words for all 604 pages
  console.log(`Fetching QCF words for ${TOTAL_PAGES} pages...`);
  const insertWord = db.prepare(
    'INSERT INTO mushaf_words (surah_number, ayah_number, word_position, page_number, line_number, code_v1, code_v2, char_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
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
          codeV1: string;
          codeV2: string;
          charType: string;
        }>
      ) => {
        for (const w of words) {
          insertWord.run(w.surah, w.ayah, w.position, w.page, w.line, w.codeV1, w.codeV2, w.charType);
        }
      }
    );

    const wordsToInsert: Array<{
      surah: number;
      ayah: number;
      position: number;
      page: number;
      line: number;
      codeV1: string;
      codeV2: string;
      charType: string;
    }> = [];

    while (hasMore) {
      const url = `${API_BASE}/verses/by_page/${page}?words=true&per_page=50&page=${apiPage}&word_fields=code_v1,code_v2,line_number,page_number&fields=verse_key`;
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
            codeV1: word.code_v1,
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

  console.log(`Fetching IndoPak words for ${TOTAL_PAGES} pages...`);
  const insertIndopakWord = db.prepare(
    'INSERT INTO indopak_words (surah_number, ayah_number, word_position, page_number, line_number, text_indopak, char_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  let totalIndopakWordsInserted = 0;

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
          textIndopak: string;
          charType: string;
        }>
      ) => {
        for (const w of words) {
          insertIndopakWord.run(w.surah, w.ayah, w.position, w.page, w.line, w.textIndopak, w.charType);
        }
      }
    );

    const wordsToInsert: Array<{
      surah: number;
      ayah: number;
      position: number;
      page: number;
      line: number;
      textIndopak: string;
      charType: string;
    }> = [];

    while (hasMore) {
      const url = `${API_BASE}/verses/by_page/${page}?words=true&per_page=50&page=${apiPage}&word_fields=text_indopak,line_number,page_number&fields=verse_key&mushaf=3`;
      const response = await fetchJson<IndopakPageResponse>(url);

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
            textIndopak: word.text_indopak,
            charType: word.char_type_name,
          });
          pageWordCount++;
        }
      }

      hasMore = response.pagination.next_page !== null;
      apiPage++;
    }

    insertPageWords(wordsToInsert);
    totalIndopakWordsInserted += pageWordCount;

    if (page % 50 === 0 || page === 1 || page === TOTAL_PAGES) {
      console.log(`  IndoPak page ${page}/${TOTAL_PAGES}: ${pageWordCount} words (total: ${totalIndopakWordsInserted})`);
    }

    await delay(DELAY_MS);
  }

  console.log(`Total IndoPak words inserted: ${totalIndopakWordsInserted}`);

  // Step 5: Fetch QCF fonts for all 604 pages
  await seedFonts(db, 'qcf_fonts', FONT_CDN_V2, 'QCF v2');
  await seedFonts(db, 'qcf_v1_fonts', FONT_CDN_V1, 'QCF v1');
  await seedFonts(db, 'qcf_v4_fonts', FONT_CDN_V4, 'QCF v4 Tajweed');

  // Step 6: Integrity checks
  console.log('\nRunning integrity checks...');

  const wordCount = db.prepare('SELECT COUNT(*) as c FROM mushaf_words').get() as { c: number };
  console.log(`  mushaf_words count: ${wordCount.c} (expected ~77,000-84,000)`);
  if (wordCount.c < 75000 || wordCount.c > 90000) {
    throw new Error(`Expected 75,000-90,000 words, got ${wordCount.c}`);
  }

  const indopakWordCount = db.prepare('SELECT COUNT(*) as c FROM indopak_words').get() as { c: number };
  console.log(`  indopak_words count: ${indopakWordCount.c} (expected ~77,000-84,000)`);
  if (indopakWordCount.c < 75000 || indopakWordCount.c > 90000) {
    throw new Error(`Expected 75,000-90,000 IndoPak words, got ${indopakWordCount.c}`);
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

  const distinctIndopakPages = db.prepare('SELECT COUNT(DISTINCT page_number) as c FROM indopak_words').get() as {
    c: number;
  };
  console.log(`  Distinct IndoPak pages with words: ${distinctIndopakPages.c} (expected 604)`);
  if (distinctIndopakPages.c !== 604) {
    throw new Error(`Expected 604 distinct IndoPak pages, got ${distinctIndopakPages.c}`);
  }

  const fontPages = db.prepare('SELECT COUNT(*) as c FROM qcf_fonts').get() as { c: number };
  console.log(`  Font pages: ${fontPages.c} (expected 604)`);
  if (fontPages.c !== 604) {
    throw new Error(`Expected 604 font pages, got ${fontPages.c}`);
  }

  const fontV1Pages = db.prepare('SELECT COUNT(*) as c FROM qcf_v1_fonts').get() as { c: number };
  console.log(`  V1 font pages: ${fontV1Pages.c} (expected 604)`);
  if (fontV1Pages.c !== 604) {
    throw new Error(`Expected 604 V1 font pages, got ${fontV1Pages.c}`);
  }

  const fontV4Pages = db.prepare('SELECT COUNT(*) as c FROM qcf_v4_fonts').get() as { c: number };
  console.log(`  V4 font pages: ${fontV4Pages.c} (expected 604)`);
  if (fontV4Pages.c !== 604) {
    throw new Error(`Expected 604 V4 font pages, got ${fontV4Pages.c}`);
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

  // No empty code_v1 values
  const emptyCodeV1 = db.prepare(
    "SELECT COUNT(*) as c FROM mushaf_words WHERE code_v1 IS NULL OR code_v1 = ''"
  ).get() as { c: number };
  console.log(`  Empty code_v1 values: ${emptyCodeV1.c} (expected 0)`);
  if (emptyCodeV1.c > 0) {
    throw new Error(`Found ${emptyCodeV1.c} words with empty code_v1`);
  }

  // No empty IndoPak text values
  const emptyIndopakText = db.prepare(
    "SELECT COUNT(*) as c FROM indopak_words WHERE text_indopak IS NULL OR text_indopak = ''"
  ).get() as { c: number };
  console.log(`  Empty text_indopak values: ${emptyIndopakText.c} (expected 0)`);
  if (emptyIndopakText.c > 0) {
    throw new Error(`Found ${emptyIndopakText.c} words with empty text_indopak`);
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

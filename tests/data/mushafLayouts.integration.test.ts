import crypto from 'node:crypto';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
  DEFAULT_MUSHAF_LAYOUT_ID,
  MUSHAF_LAYOUTS,
  getMushafLayout,
} from '../../src/data/mushafLayouts';

const databasePath = path.resolve(__dirname, '../../assets/db/quran.db');

describe('bundled Mushaf content packs', () => {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });

  afterAll(() => db.close());

  it('registers stable, explicit upstream Mushaf identities', () => {
    expect(MUSHAF_LAYOUTS.map((layout) => layout.id)).toEqual([
      'madani-qcf-v2-hafs',
      'indopak-15-line-hafs',
    ]);
    expect(getMushafLayout(DEFAULT_MUSHAF_LAYOUT_ID)).toMatchObject({
      upstreamMushafId: 1,
      rendererKind: 'qcf-page-font',
      pageCount: 604,
      linesPerPage: 15,
    });
    expect(getMushafLayout('indopak-15-line-hafs')).toMatchObject({
      upstreamMushafId: 6,
      rendererKind: 'unicode-authoritative-lines',
      pageCount: 610,
      linesPerPage: 15,
    });
  });

  it('pins the ordered Madani QCF V2 words and all matching page fonts', () => {
    const descriptor = getMushafLayout('madani-qcf-v2-hafs');
    const dataHash = crypto.createHash('sha256');
    const words = db.prepare(
      `SELECT id, surah_number, ayah_number, word_position, page_number,
              line_number, code_v2, char_type FROM mushaf_words ORDER BY id`
    ).iterate() as IterableIterator<Record<string, string | number>>;
    for (const word of words) {
      dataHash.update(
        `${word.id}|${word.surah_number}|${word.ayah_number}|${word.word_position}|${word.page_number}|${word.line_number}|${word.code_v2}|${word.char_type}\n`
      );
    }

    const fontsHash = crypto.createHash('sha256');
    const fonts = db.prepare(
      'SELECT page_number, font_data FROM qcf_fonts ORDER BY page_number'
    ).iterate() as IterableIterator<{ page_number: number; font_data: string }>;
    for (const font of fonts) {
      const pageHash = crypto.createHash('sha256')
        .update(Buffer.from(font.font_data, 'base64'))
        .digest('hex');
      fontsHash.update(`${font.page_number}|${pageHash}\n`);
    }

    expect(dataHash.digest('hex')).toBe(descriptor.expected.dataSha256);
    expect(fontsHash.digest('hex')).toBe(descriptor.expected.fontSha256);
    expect(db.prepare(
      `SELECT source_version AS sourceVersion, data_sha256 AS dataSha256,
              font_sha256 AS fontSha256, page_count AS pageCount,
              lines_per_page AS linesPerPage, word_count AS wordCount,
              ayah_count AS ayahCount
       FROM mushaf_layout_manifests WHERE layout_id = ?`
    ).get(descriptor.id)).toEqual({
      sourceVersion: descriptor.dataVersion,
      dataSha256: descriptor.expected.dataSha256,
      fontSha256: descriptor.expected.fontSha256,
      pageCount: 604,
      linesPerPage: 15,
      wordCount: 83665,
      ayahCount: 6236,
    });
  });

  it('pins a complete and internally consistent IndoPak pack manifest', () => {
    const descriptor = getMushafLayout('indopak-15-line-hafs');
    const manifest = db.prepare(
      `SELECT source_version AS sourceVersion, data_sha256 AS dataSha256,
              font_sha256 AS fontSha256, page_count AS pageCount,
              lines_per_page AS linesPerPage, word_count AS wordCount,
              ayah_count AS ayahCount
       FROM mushaf_layout_manifests WHERE layout_id = ?`
    ).get(descriptor.id);

    expect(manifest).toEqual({
      sourceVersion: descriptor.dataVersion,
      dataSha256: descriptor.expected.dataSha256,
      fontSha256: descriptor.expected.fontSha256,
      pageCount: 610,
      linesPerPage: 15,
      wordCount: 83668,
      ayahCount: 6236,
    });

    const counts = db.prepare(
      `SELECT COUNT(*) AS words,
              COUNT(DISTINCT page_number) AS pages,
              COUNT(DISTINCT surah_number || ':' || ayah_number) AS ayahs,
              COUNT(DISTINCT canonical_word_key) AS canonicalKeys
       FROM mushaf_layout_words WHERE layout_id = ?`
    ).get(descriptor.id) as Record<string, number>;
    expect(counts).toEqual({ words: 83668, pages: 610, ayahs: 6236, canonicalKeys: 83668 });

    const lines = db.prepare(
      `SELECT COUNT(*) AS count, MIN(line_number) AS minLine, MAX(line_number) AS maxLine
       FROM mushaf_layout_lines WHERE layout_id = ?`
    ).get(descriptor.id);
    expect(lines).toEqual({ count: 9150, minLine: 1, maxLine: 15 });
  });

  it('bundles the exact verified renderer font for offline use', () => {
    const descriptor = getMushafLayout('indopak-15-line-hafs');
    const asset = db.prepare(
      `SELECT mime_type AS mimeType, sha256, data_base64 AS dataBase64
       FROM mushaf_layout_assets WHERE layout_id = ? AND asset_key = 'primary-font'`
    ).get(descriptor.id) as { mimeType: string; sha256: string; dataBase64: string };

    expect(asset.mimeType).toBe('font/woff2');
    expect(asset.sha256).toBe(descriptor.expected.fontSha256);
    expect(crypto.createHash('sha256').update(Buffer.from(asset.dataBase64, 'base64')).digest('hex'))
      .toBe(descriptor.expected.fontSha256);
  });

  it('maps one canonical Quran location to edition-specific pages', () => {
    const madani = db.prepare(
      `SELECT MIN(page_number) AS page FROM mushaf_words
       WHERE surah_number = 112 AND ayah_number = 1`
    ).get() as { page: number };
    const indopak = db.prepare(
      `SELECT MIN(page_number) AS page FROM mushaf_layout_words
       WHERE layout_id = 'indopak-15-line-hafs' AND surah_number = 112 AND ayah_number = 1`
    ).get() as { page: number };

    expect(madani.page).toBe(604);
    expect(indopak.page).toBe(609);
    expect(db.prepare(
      `SELECT MAX(page_number) AS page FROM mushaf_layout_words
       WHERE layout_id = 'indopak-15-line-hafs' AND surah_number = 114 AND ayah_number = 6`
    ).get()).toEqual({ page: 610 });
  });

  it('keeps the final page as an authoritative 15-slot boundary page', () => {
    const lines = db.prepare(
      `SELECT line_number AS lineNumber, line_type AS lineType, surah_number AS surahNumber
       FROM mushaf_layout_lines
       WHERE layout_id = 'indopak-15-line-hafs' AND page_number = 610
       ORDER BY line_number`
    ).all() as Array<{ lineNumber: number; lineType: string; surahNumber: number | null }>;

    expect(lines).toHaveLength(15);
    expect(lines[0]).toMatchObject({ lineNumber: 1, lineType: 'surah_name', surahNumber: 113 });
    expect(lines.some((line) => line.lineType === 'surah_name' && line.surahNumber === 114)).toBe(true);
    expect(lines.at(-1)).toMatchObject({ lineNumber: 15, lineType: 'empty' });
  });
});

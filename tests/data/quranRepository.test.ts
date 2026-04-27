// Mock the database module for unit tests
// For now, we mock the database layer to test repository logic

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
};

jest.mock('../../src/data/database', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

import {
  getSurahs,
  getAyahsBySurah,
  getJuzList,
  getSurahByNumber,
  getSurahLastAyah,
  searchSurahs,
  getQcfV1WordsByPage,
  getQcfV1Font,
  getQcfV4Font,
  getIndopakWordsByPage,
  getUthmaniWordsByPage,
  getIndopakNastaleeqFont,
  getDigitalKhattIndopakFont,
} from '../../src/data/quranRepository';

describe('quranRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup the getDatabase mock after clearAllMocks
    const { getDatabase } = require('../../src/data/database');
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getSurahs', () => {
    it('returns mapped surah objects', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        { number: 1, name_arabic: 'الفاتحة', name_english: 'Al-Fatiha', ayah_count: 7, revelation_type: 'Makki', revelation_order: 5, juz_start: 1 },
        { number: 2, name_arabic: 'البقرة', name_english: 'Al-Baqarah', ayah_count: 286, revelation_type: 'Madani', revelation_order: 87, juz_start: 1 },
      ]);

      const surahs = await getSurahs();
      expect(surahs).toHaveLength(2);
      expect(surahs[0]).toEqual({
        number: 1,
        nameArabic: 'الفاتحة',
        nameEnglish: 'Al-Fatiha',
        ayahCount: 7,
        revelationType: 'Makki',
        revelationOrder: 5,
        juzStart: 1,
      });
    });

    it('calls database with correct query', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      await getSurahs();
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM surahs ORDER BY number');
    });
  });

  describe('getAyahsBySurah', () => {
    it('returns mapped ayah objects', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        { id: 1, surah_number: 1, ayah_number: 1, text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', juz_number: 1, hizb_number: 1, page_number: 1 },
        { id: 2, surah_number: 1, ayah_number: 2, text_uthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', juz_number: 1, hizb_number: 1, page_number: 1 },
      ]);

      const ayahs = await getAyahsBySurah(1);
      expect(ayahs).toHaveLength(2);
      expect(ayahs[0].surahNumber).toBe(1);
      expect(ayahs[0].ayahNumber).toBe(1);
      expect(ayahs[0].textUthmani).toContain('بِسْمِ');
    });

    it('calls database with correct query and params', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      await getAyahsBySurah(1);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM ayahs WHERE surah_number = ? ORDER BY ayah_number',
        [1]
      );
    });
  });

  describe('getJuzList', () => {
    it('returns mapped juz objects', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        { number: 1, start_surah: 1, start_ayah: 1, end_surah: 2, end_ayah: 141 },
      ]);

      const juzList = await getJuzList();
      expect(juzList).toHaveLength(1);
      expect(juzList[0]).toEqual({
        number: 1,
        startSurah: 1,
        startAyah: 1,
        endSurah: 2,
        endAyah: 141,
      });
    });
  });

  describe('getSurahByNumber', () => {
    it('returns a mapped surah when found', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({
        number: 1, name_arabic: 'الفاتحة', name_english: 'Al-Fatiha', ayah_count: 7, revelation_type: 'Makki', revelation_order: 5, juz_start: 1,
      });

      const surah = await getSurahByNumber(1);
      expect(surah).not.toBeNull();
      expect(surah!.nameEnglish).toBe('Al-Fatiha');
    });

    it('returns null when not found', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);
      const surah = await getSurahByNumber(999);
      expect(surah).toBeNull();
    });
  });

  describe('getSurahLastAyah', () => {
    it('returns the ayah count for a known surah', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({
        number: 1, name_arabic: 'الفاتحة', name_english: 'Al-Fatiha', ayah_count: 7, revelation_type: 'Makki', revelation_order: 5, juz_start: 1,
      });

      await expect(getSurahLastAyah(1)).resolves.toBe(7);
    });

    it('throws when the surah does not exist', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      await expect(getSurahLastAyah(999)).rejects.toThrow('Surah 999 not found');
    });
  });

  describe('searchSurahs', () => {
    it('calls database with correct LIKE query', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      await searchSurahs('fatiha');
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM surahs WHERE name_english LIKE ? OR name_arabic LIKE ? OR CAST(number AS TEXT) = ? ORDER BY number',
        ['%fatiha%', '%fatiha%', 'fatiha']
      );
    });
  });

  describe('getQcfV1WordsByPage', () => {
    it('maps local QCF V1 glyphs into the mushaf word shape', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 11,
          surah_number: 2,
          ayah_number: 1,
          word_position: 1,
          page_number: 2,
          line_number: 3,
          code_v1: 'ﭑ',
          char_type: 'word',
        },
      ]);

      const words = await getQcfV1WordsByPage(2);

      expect(words[0]).toMatchObject({
        surahNumber: 2,
        ayahNumber: 1,
        wordPosition: 1,
        pageNumber: 2,
        lineNumber: 3,
        codeV2: 'ﭑ',
        charType: 'word',
      });
    });

    it('fetches QCF V1 glyphs when the bundled database has only V2 columns', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('no such column: code_v1'));
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          verses: [
            {
              verse_key: '2:1',
              words: [
                {
                  id: 11,
                  position: 1,
                  char_type_name: 'word',
                  code_v1: 'ﭑ',
                  line_number: 3,
                  page_number: 2,
                },
              ],
            },
          ],
          pagination: { next_page: null },
        }),
      } as Response);

      const words = await getQcfV1WordsByPage(2);

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('word_fields=code_v1,line_number,page_number'));
      expect(words[0].codeV2).toBe('ﭑ');

      fetchMock.mockRestore();
    });
  });

  describe('getQcfV1Font', () => {
    it('fetches and base64 encodes the QCF V1 page font', async () => {
      mockDb.getFirstAsync.mockRejectedValueOnce(new Error('no such table: qcf_v1_fonts'));
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from([77, 97, 110]).buffer,
      } as Response);

      const font = await getQcfV1Font(2);

      expect(fetchMock).toHaveBeenCalledWith('https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p2.woff2');
      expect(font).toBe('TWFu');

      fetchMock.mockRestore();
    });
  });

  describe('getQcfV4Font', () => {
    it('fetches and base64 encodes the QCF V4 Tajweed COLRv1 page font', async () => {
      mockDb.getFirstAsync.mockRejectedValueOnce(new Error('no such table: qcf_v4_fonts'));
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from([84, 97, 106]).buffer,
      } as Response);

      const font = await getQcfV4Font(2);

      expect(fetchMock).toHaveBeenCalledWith('https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p2.woff2');
      expect(font).toBe('VGFq');

      fetchMock.mockRestore();
    });
  });

  describe('getIndopakWordsByPage', () => {
    it('maps local IndoPak text into the mushaf word shape', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 11,
          surah_number: 2,
          ayah_number: 1,
          word_position: 1,
          page_number: 2,
          line_number: 3,
          text_indopak: 'الٓمّٓۚ‏',
          char_type: 'word',
        },
      ]);

      const words = await getIndopakWordsByPage(2);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('FROM indopak_words'), [2]);
      expect(words[0]).toMatchObject({
        surahNumber: 2,
        ayahNumber: 1,
        wordPosition: 1,
        pageNumber: 2,
        lineNumber: 3,
        codeV2: 'الٓمّٓۚ‏',
        charType: 'word',
      });
    });

    it('fetches IndoPak word text when the bundled database has only QCF glyph columns', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('no such column: text_indopak'));
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          verses: [
            {
              verse_key: '2:1',
              words: [
                {
                  id: 11,
                  position: 1,
                  char_type_name: 'word',
                  text_indopak: 'الٓمّٓۚ‏',
                  line_number: 3,
                  page_number: 2,
                },
              ],
            },
          ],
          pagination: { next_page: null },
        }),
      } as Response);

      const words = await getIndopakWordsByPage(2);

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('word_fields=text_indopak,line_number,page_number'));
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('mushaf=3'));
      expect(words[0].codeV2).toBe('الٓمّٓۚ‏');

      fetchMock.mockRestore();
    });
  });

  describe('getUthmaniWordsByPage', () => {
    it('fetches Uthmani Unicode word text for Digital Khatt rendering', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          verses: [
            {
              verse_key: '2:3',
              words: [
                {
                  id: 16,
                  position: 1,
                  char_type_name: 'word',
                  text_uthmani: 'ٱلَّذِينَ',
                  line_number: 4,
                  page_number: 2,
                },
                {
                  id: 17,
                  position: 2,
                  char_type_name: 'word',
                  text_uthmani: 'يُؤْمِنُونَ',
                  line_number: 4,
                  page_number: 2,
                },
              ],
            },
          ],
          pagination: { next_page: null },
        }),
      } as Response);

      const words = await getUthmaniWordsByPage(2);

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('word_fields=text_uthmani,line_number,page_number'));
      expect(fetchMock.mock.calls[0][0]).not.toContain('mushaf=3');
      expect(words.map((word) => word.codeV2).join(' ')).toBe('ٱلَّذِينَ يُؤْمِنُونَ');
    });
  });

  describe('IndoPak font loaders', () => {
    it('fetches and base64 encodes the IndoPak Nastaleeq font', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from([78, 97, 115]).buffer,
      } as Response);

      const font = await getIndopakNastaleeqFont();

      expect(fetchMock).toHaveBeenCalledWith('https://verses.quran.foundation/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2');
      expect(font).toBe('TmFz');

      fetchMock.mockRestore();
    });

    it('fetches and base64 encodes the Digital Khatt IndoPak font', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from([68, 75, 73]).buffer,
      } as Response);

      const font = await getDigitalKhattIndopakFont();

      expect(fetchMock).toHaveBeenCalledWith('https://quranfonts.com/fonts/Digital%20Khatt%20Indopak%20font/DigitalKhattIndoPak.otf');
      expect(font).toBe('REtJ');

      fetchMock.mockRestore();
    });
  });
});

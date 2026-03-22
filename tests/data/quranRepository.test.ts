// Mock the database module for unit tests
// For now, we mock the database layer to test repository logic

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
};

jest.mock('../../src/data/database', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

import { getSurahs, getAyahsBySurah, getJuzList, getSurahByNumber, searchSurahs } from '../../src/data/quranRepository';

describe('quranRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup the getDatabase mock after clearAllMocks
    const { getDatabase } = require('../../src/data/database');
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
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
});

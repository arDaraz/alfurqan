const mockDb = {
  getFirstAsync: jest.fn(),
};

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

import { getTopAyahForPage } from '../quranRepository';

describe('getTopAyahForPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getDatabase } = require('../database');
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns the first distinct ayah ordered by line and word id', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      surah_number: 2,
      ayah_number: 6,
    });

    await expect(getTopAyahForPage(2)).resolves.toEqual({
      surahNumber: 2,
      ayahNumber: 6,
    });
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
      `SELECT surah_number, ayah_number
     FROM mushaf_words
     WHERE page_number = ?
     GROUP BY surah_number, ayah_number
     ORDER BY MIN(line_number), MIN(id)
     LIMIT 1`,
      [2]
    );
  });

  it('throws when a page has no ayah words', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    await expect(getTopAyahForPage(999)).rejects.toThrow('No ayah found for page 999');
  });
});

describe('getPageForAyah', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getDatabase } = require('../database');
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns the mushaf page that contains the ayah', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      page_number: 2,
    });
    const { getPageForAyah } = require('../quranRepository');

    expect(getPageForAyah).toEqual(expect.any(Function));
    await expect(getPageForAyah(2, 1)).resolves.toBe(2);
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
      'SELECT page_number FROM ayahs WHERE surah_number = ? AND ayah_number = ?',
      [2, 1]
    );
  });
});

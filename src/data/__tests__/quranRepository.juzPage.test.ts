const mockDb = {
  getFirstAsync: jest.fn(),
};

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

import { getJuzAndPageForAyah } from '../quranRepository';

describe('getJuzAndPageForAyah', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getDatabase } = require('../database');
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns juz 3 page 42 for Al-Baqarah 255', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ juz_number: 3, page_number: 42 });

    await expect(getJuzAndPageForAyah(2, 255)).resolves.toEqual({ juz: 3, page: 42 });
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
      'SELECT juz_number, page_number FROM ayahs WHERE surah_number = ? AND ayah_number = ?',
      [2, 255]
    );
  });

  it('returns juz 1 page 1 for Al-Fatihah 1', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ juz_number: 1, page_number: 1 });

    await expect(getJuzAndPageForAyah(1, 1)).resolves.toEqual({ juz: 1, page: 1 });
  });

  it('throws for an unknown ayah', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    await expect(getJuzAndPageForAyah(1, 999)).rejects.toThrow(/no juz\/page/i);
  });
});

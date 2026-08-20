const mockDb = {
  getFirstAsync: jest.fn(),
};

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

import { getDatabase } from '../database';
import { getMushafJuzAndPageForAyah } from '../quranRepository';
import { DEFAULT_MUSHAF_LAYOUT_ID } from '../mushafLayouts';

describe('getMushafJuzAndPageForAyah', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns juz 3 page 42 for Al-Baqarah 255', async () => {
    mockDb.getFirstAsync
      .mockResolvedValueOnce({ juz_number: 3 })
      .mockResolvedValueOnce({ page_number: 42 });

    await expect(
      getMushafJuzAndPageForAyah(DEFAULT_MUSHAF_LAYOUT_ID, 2, 255)
    ).resolves.toEqual({ juz: 3, page: 42 });
  });

  it('returns juz 1 page 1 for Al-Fatihah 1', async () => {
    mockDb.getFirstAsync
      .mockResolvedValueOnce({ juz_number: 1 })
      .mockResolvedValueOnce({ page_number: 1 });

    await expect(
      getMushafJuzAndPageForAyah(DEFAULT_MUSHAF_LAYOUT_ID, 1, 1)
    ).resolves.toEqual({ juz: 1, page: 1 });
  });

  it('throws when the ayah has no juz', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    await expect(
      getMushafJuzAndPageForAyah(DEFAULT_MUSHAF_LAYOUT_ID, 1, 999)
    ).rejects.toThrow(/no juz/i);
  });

  it('throws when no page maps to the ayah', async () => {
    mockDb.getFirstAsync
      .mockResolvedValueOnce({ juz_number: 1 })
      .mockResolvedValueOnce(null);

    await expect(
      getMushafJuzAndPageForAyah(DEFAULT_MUSHAF_LAYOUT_ID, 1, 1)
    ).rejects.toThrow(/no page maps/i);
  });
});

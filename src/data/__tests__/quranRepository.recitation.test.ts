const mockDb = {
  getFirstAsync: jest.fn(),
};

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

import { getDatabase } from '../database';
import { getMushafTopAyahForPage, getMushafPageForAyah } from '../quranRepository';
import { DEFAULT_MUSHAF_LAYOUT_ID } from '../mushafLayouts';

describe('getMushafTopAyahForPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns the first ayah on the page with its word position', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      surah_number: 2,
      ayah_number: 6,
      word_position: 1,
    });

    await expect(
      getMushafTopAyahForPage(DEFAULT_MUSHAF_LAYOUT_ID, 2)
    ).resolves.toEqual({
      surahNumber: 2,
      ayahNumber: 6,
      wordPosition: 1,
    });
  });

  it('throws when the page carries no Quran text', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    await expect(
      getMushafTopAyahForPage(DEFAULT_MUSHAF_LAYOUT_ID, 2)
    ).rejects.toThrow(/contains no Quran text/i);
  });

  it('rejects a page outside the layout range', async () => {
    await expect(
      getMushafTopAyahForPage(DEFAULT_MUSHAF_LAYOUT_ID, 9999)
    ).rejects.toThrow();
  });
});

describe('getMushafPageForAyah', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  it('returns the page that contains the ayah', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ page_number: 2 });

    await expect(
      getMushafPageForAyah(DEFAULT_MUSHAF_LAYOUT_ID, 2, 1)
    ).resolves.toBe(2);
  });

  it('throws when no page maps to the ayah', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    await expect(
      getMushafPageForAyah(DEFAULT_MUSHAF_LAYOUT_ID, 2, 1)
    ).rejects.toThrow(/no page maps/i);
  });
});

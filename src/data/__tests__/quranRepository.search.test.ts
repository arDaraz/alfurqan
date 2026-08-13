const mockDb = {
  getAllAsync: jest.fn(),
};

jest.mock('../database', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb)),
}));

import { searchAyahs, __resetAyahSearchCacheForTests } from '../quranRepository';

const sampleRows = [
  { id: 1, surah_number: 1, ayah_number: 1, text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', juz_number: 1, page_number: 1 },
  { id: 3, surah_number: 1, ayah_number: 3, text_uthmani: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', juz_number: 1, page_number: 1 },
  { id: 5500, surah_number: 55, ayah_number: 1, text_uthmani: 'ٱلرَّحْمَٰنُ', juz_number: 27, page_number: 531 },
  { id: 18, surah_number: 2, ayah_number: 1, text_uthmani: 'الٓمٓ', juz_number: 1, page_number: 2 },
];

describe('searchAyahs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetAyahSearchCacheForTests();
    mockDb.getAllAsync.mockResolvedValue(sampleRows);
  });

  it('returns an empty array for an empty or whitespace query', async () => {
    await expect(searchAyahs('')).resolves.toEqual([]);
    await expect(searchAyahs('   ')).resolves.toEqual([]);
  });

  it('finds matches across Uthmani diacritics and alif-wasla', async () => {
    const results = await searchAyahs('الرحمن');
    expect(results.map((r) => `${r.surahNumber}:${r.ayahNumber}`)).toEqual([
      '1:1',
      '1:3',
      '55:1',
    ]);
  });

  it('returns an empty array for an unknown word', async () => {
    await expect(searchAyahs('xyz')).resolves.toEqual([]);
  });

  it('honours an explicit limit', async () => {
    const results = await searchAyahs('الرحمن', 2);
    expect(results).toHaveLength(2);
  });

  it('queries the database only once across calls (cached)', async () => {
    await searchAyahs('الرحمن');
    await searchAyahs('xyz');
    expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
  });
});

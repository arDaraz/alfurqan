import { getAyahPreview, __resetAyahPreviewCacheForTests } from '../quranRepository';

const longText =
  'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ';

jest.mock('../database', () => {
  const getAllAsync = jest.fn();
  return {
    __mock: { getAllAsync },
    getDatabase: async () => ({ getAllAsync }),
  };
});

const mock = (jest.requireMock('../database') as { __mock: { getAllAsync: jest.Mock } }).__mock;

describe('getAyahPreview', () => {
  beforeEach(() => {
    mock.getAllAsync.mockReset();
    __resetAyahPreviewCacheForTests();
  });

  it('returns the full text untruncated when shorter than the limit', async () => {
    mock.getAllAsync.mockResolvedValueOnce([{ text_uthmani: 'بِسْمِ اللَّهِ' }]);
    await expect(getAyahPreview(1, 1)).resolves.toBe('بِسْمِ اللَّهِ');
  });

  it('truncates to ~80 chars and appends an ellipsis', async () => {
    mock.getAllAsync.mockResolvedValueOnce([{ text_uthmani: longText }]);
    const preview = await getAyahPreview(2, 255);
    expect(preview.length).toBeLessThanOrEqual(81); // 80 chars + …
    expect(preview.endsWith('…')).toBe(true);
  });

  it('caches the result; second call does not hit the database', async () => {
    mock.getAllAsync.mockResolvedValueOnce([{ text_uthmani: longText }]);
    await getAyahPreview(2, 255);
    await getAyahPreview(2, 255);
    expect(mock.getAllAsync).toHaveBeenCalledTimes(1);
  });

  it('returns empty string when the ayah is not found', async () => {
    mock.getAllAsync.mockResolvedValueOnce([]);
    await expect(getAyahPreview(99, 99)).resolves.toBe('');
  });
});

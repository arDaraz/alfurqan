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

  it('does not orphan an Arabic base letter by stripping its combining mark', async () => {
    // Construct a string where char[79] is a base letter ('ب') and char[80]
    // is its fatha combining mark (U+064E). Without the fix, slice(0, 80)
    // would end on the orphaned 'ب' with its vowel dropped.
    // Layout: 79 × 'ا' (alef, no mark) + 'بَ' (ba + fatha) + 20 × 'ا' = 101 chars.
    // slice(0, 80) → 79 alefs + 'ب' (index 79); char[80] = fatha → orphan.
    // safeTruncate should step back to cut=79, slicing off the orphan base,
    // so the preview ends with the last alef (index 78) then '…'.
    const orphan = 'ا'.repeat(79) + 'بَ' + 'ا'.repeat(20);
    mock.getAllAsync.mockResolvedValueOnce([{ text_uthmani: orphan }]);
    const preview = await getAyahPreview(5, 5);
    // The base letter 'ب' must have been dropped (its mark was char[80]).
    const beforeEllipsis = preview.slice(0, -1); // strip '…'
    expect(beforeEllipsis.endsWith('ب')).toBe(false);
    expect(preview.endsWith('…')).toBe(true);
    // The preview should not exceed the limit + ellipsis length.
    expect(beforeEllipsis.length).toBeLessThanOrEqual(80);
  });
});

import { normalizeQuranText, tokenizeQuranText } from '../quranTextNormalizer';

describe('quranTextNormalizer', () => {
  it('normalizes Uthmani Quran text into base Arabic words', () => {
    expect(
      normalizeQuranText('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ')
    ).toBe('بسم الله الرحمن الرحيم');
  });

  it('normalizes Quranic marks, tatweel, ayah numbers, and repeated whitespace', () => {
    expect(
      normalizeQuranText('  صِرَٰطَ  ٱلَّذِينَ  أَنْعَمْتَ عَلَيْهِمْ ﴿٧﴾ ')
    ).toBe('صراط الذين انعمت عليهم');
  });

  it('tokenizes normalized words for comparison', () => {
    expect(tokenizeQuranText('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ')).toEqual([
      'الحمد',
      'لله',
      'رب',
      'العالمين',
    ]);
  });
});

import { toArabicIndic, normalizeArabic } from '../../src/utils/arabic';

describe('toArabicIndic', () => {
  it('converts 1 to Arabic-Indic numeral', () => {
    expect(toArabicIndic(1)).toBe('\u0661');
  });

  it('converts 0 to Arabic-Indic numeral', () => {
    expect(toArabicIndic(0)).toBe('\u0660');
  });

  it('converts 286 to Arabic-Indic numeral', () => {
    expect(toArabicIndic(286)).toBe('\u0662\u0668\u0666');
  });

  it('converts 114 to Arabic-Indic numeral', () => {
    expect(toArabicIndic(114)).toBe('\u0661\u0661\u0664');
  });

  it('converts multi-digit numbers correctly', () => {
    expect(toArabicIndic(10)).toBe('\u0661\u0660');
  });
});

describe('normalizeArabic', () => {
  it('strips diacritical marks', () => {
    const input = '\u0628\u0650\u0633\u0652\u0645\u0650'; // bi-smi with diacritics
    const expected = '\u0628\u0633\u0645'; // bsm without diacritics
    expect(normalizeArabic(input)).toBe(expected);
  });

  it('returns text unchanged if no diacritics', () => {
    const input = 'بسم';
    expect(normalizeArabic(input)).toBe(input);
  });
});

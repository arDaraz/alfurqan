import { normalizeForSearch } from '../arabic';

describe('normalizeForSearch', () => {
  it('strips Uthmani diacritics and folds alif-wasla', () => {
    expect(normalizeForSearch('ٱلرَّحْمَٰنِ')).toBe('الرحمن');
  });

  it('removes tatweel kashida', () => {
    expect(normalizeForSearch('ـالـرحـمـن')).toBe('الرحمن');
  });

  it('folds alif-maqsura and ta-marbuta to common typing variants', () => {
    expect(normalizeForSearch('علىٰ')).toBe('علي');
    expect(normalizeForSearch('رحمة')).toBe('رحمه');
  });

  it('removes Quranic small high/low annotation marks', () => {
    const withMark = 'أ۞ب';
    expect(normalizeForSearch(withMark)).toBe('أب');
  });

  it('returns an empty string when input is whitespace', () => {
    expect(normalizeForSearch('   ')).toBe('');
  });
});

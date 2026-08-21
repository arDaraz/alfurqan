const TASHKEEL = /[\u064B-\u065F]/g;
const DAGGER_ALEF = /\u0670/g;
const QURANIC_ANNOTATION_MARKS = /[\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;
const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g;
const AYAH_MARKERS_AND_DIGITS = /[\uFD3F\uFD3E\u06DD\u06DE\u0660-\u0669\u06F0-\u06F9]/g;
const NON_ARABIC_WORD_SEPARATORS = /[^\u0621-\u064A\s]/g;
const WHITESPACE = /\s+/g;
const IMLAEI_EXCEPTIONS: [RegExp, string][] = [
  [/رحمان/g, 'رحمن'],
];

export function normalizeQuranText(text: string): string {
  const normalized = text
    .normalize('NFKC')
    .replace(ALEF_VARIANTS, 'ا')
    .replace(DAGGER_ALEF, 'ا')
    .replace(TASHKEEL, '')
    .replace(QURANIC_ANNOTATION_MARKS, '')
    .replace(TATWEEL, '')
    .replace(AYAH_MARKERS_AND_DIGITS, ' ')
    .replace(NON_ARABIC_WORD_SEPARATORS, ' ')
    .replace(WHITESPACE, ' ')
    .trim();

  return IMLAEI_EXCEPTIONS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    normalized
  );
}

export function tokenizeQuranText(text: string): string[] {
  const normalized = normalizeQuranText(text);
  return normalized.length === 0 ? [] : normalized.split(' ');
}

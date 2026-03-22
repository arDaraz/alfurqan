/** Convert Western Arabic numeral to Arabic-Indic numeral string */
export function toArabicIndic(num: number): string {
  return num.toString().replace(/\d/g, (d) => String.fromCharCode(0x0660 + parseInt(d)));
}

/** Normalize Arabic text for search (strip diacritics) */
export function normalizeArabic(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

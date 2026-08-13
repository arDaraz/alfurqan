/** Convert Western Arabic numeral to Arabic-Indic numeral string */
export function toArabicIndic(num: number): string {
  return num.toString().replace(/\d/g, (d) => String.fromCharCode(0x0660 + parseInt(d)));
}

/** Normalize Arabic text for search (strip diacritics) */
export function normalizeArabic(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * Clean Uthmani text for display — strip Quranic combining marks
 * that don't render correctly in React Native (appear as black circles).
 * U+06D6-U+06DC: Small high ligatures (waqf marks)
 * U+06DF: Small high rounded zero (۟) — the main offender
 * U+06E0-U+06E4: Small high letters
 * U+06EA-U+06ED: Small low/high marks
 */
export function cleanUthmaniForDisplay(text: string): string {
  return text.replace(/[\u06D6-\u06DC\u06DF-\u06E4\u06EA-\u06ED]/g, '');
}

/**
 * Normalize Uthmani text for clipboard/sharing — convert Uthmani-specific
 * characters to standard Arabic so it renders correctly in any app/font.
 */
export function uthmaniToPlainArabic(text: string): string {
  return text
    .replace(/\u0671/g, '\u0627')           // ٱ (alif wasla) → ا (alif)
    .replace(/[\u06D6-\u06DC\u06DF-\u06E4\u06EA-\u06ED]/g, '')  // strip waqf/combining marks
    .replace(/\u0640/g, '')                  // strip tatweel (kashida)
    .replace(/\s+/g, ' ')                    // collapse whitespace
    .trim();
}

/**
 * Fold Arabic text for search comparison. Apply to both query and target so
 * `String.includes` matches across Uthmani vs. user-typed text.
 */
export function normalizeForSearch(text: string): string {
  return text
    .replace(/[\u064b-\u0670]/g, '')                        // diacritics + superscript alif
    .replace(/[\u06d6-\u06ed]/g, '')                        // Quranic small high/low marks
    .replace(/\u0671/g, '\u0627')                            // alif-wasla \u2192 alif
    .replace(/\u0640/g, '')                                  // tatweel
    .replace(/\u0649/g, '\u064a')                            // alif-maqsura \u2192 ya
    .replace(/\u0629/g, '\u0647')                            // ta-marbuta \u2192 ha
    .replace(/\s+/g, ' ')
    .trim();
}

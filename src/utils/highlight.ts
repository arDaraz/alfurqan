import { normalizeForSearch } from './arabic';

export interface HighlightSegment {
  text: string;
  highlight: boolean;
}

/**
 * Split `display` into segments where any occurrence of `query` (compared
 * after Arabic normalization) is flagged as `highlight: true`. Diacritics
 * stripped by `normalizeForSearch` are returned to whichever segment owns
 * the surrounding base letter so the rendered scripture keeps its full
 * Uthmani decoration.
 */
export function highlightSearchMatches(display: string, query: string): HighlightSegment[] {
  const qNorm = normalizeForSearch(query);
  if (!qNorm) return [{ text: display, highlight: false }];

  const normChars: string[] = [];
  const backref: number[] = [];
  const charNormLength: number[] = new Array(display.length);

  for (let i = 0; i < display.length; i++) {
    const norm = normalizeForSearch(display[i]);
    charNormLength[i] = norm.length;
    for (let j = 0; j < norm.length; j++) {
      normChars.push(norm[j]);
      backref.push(i);
    }
  }
  const normStr = normChars.join('');

  if (!normStr) return [{ text: display, highlight: false }];

  const segments: HighlightSegment[] = [];
  let cursorDisplay = 0;
  let searchFromNorm = 0;

  while (searchFromNorm < normStr.length) {
    const matchNormStart = normStr.indexOf(qNorm, searchFromNorm);
    if (matchNormStart < 0) break;

    const matchDisplayStart = backref[matchNormStart];
    const matchNormEnd = matchNormStart + qNorm.length - 1;
    let matchDisplayEnd = backref[matchNormEnd] + 1;
    while (matchDisplayEnd < display.length && charNormLength[matchDisplayEnd] === 0) {
      matchDisplayEnd++;
    }

    if (matchDisplayStart > cursorDisplay) {
      segments.push({ text: display.slice(cursorDisplay, matchDisplayStart), highlight: false });
    }
    segments.push({ text: display.slice(matchDisplayStart, matchDisplayEnd), highlight: true });

    cursorDisplay = matchDisplayEnd;
    searchFromNorm = matchNormEnd + 1;
  }

  if (cursorDisplay < display.length) {
    segments.push({ text: display.slice(cursorDisplay), highlight: false });
  }

  return segments;
}

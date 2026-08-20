export interface Surah {
  number: number;
  nameArabic: string;      // e.g., 'الفاتحة'
  nameEnglish: string;     // e.g., 'Al-Fatiha'
  ayahCount: number;
  revelationType: 'Makki' | 'Madani';
  revelationOrder: number;
  juzStart: number;
}

export interface Ayah {
  id: number;
  surahNumber: number;
  ayahNumber: number;
  textUthmani: string;     // Full Uthmani text with diacritics
  juzNumber: number;
  hizbNumber: number;
  pageNumber: number;
}

export interface Juz {
  number: number;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export interface LastReadPosition {
  surahNumber: number;
  ayahNumber: number;
}

/** Layout-independent reading identity. Visual page numbers are derived per Mushaf. */
export interface CanonicalQuranLocation extends LastReadPosition {
  wordPosition?: number | null;
}

export interface MushafWord {
  id: number;
  /** Stable identity shared by every visual Mushaf: surah:ayah:word-position. */
  canonicalWordKey?: string;
  sourceWordId?: number;
  surahNumber: number;
  ayahNumber: number;
  wordPosition: number;
  pageNumber: number;
  lineNumber: number;
  codeV2: string;
  /** Unicode text retained for copy, search, accessibility and review. */
  semanticText?: string;
  charType: 'word' | 'end' | 'pause';
}

export interface MushafLine {
  lineNumber: number;
  words: MushafWord[];
  isCentered: boolean;
  lineType?: 'ayah' | 'surah_name' | 'basmallah' | 'empty';
  surahNumber?: number | null;
}

export interface PageMarker {
  type: 'juz' | 'hizb' | 'quarter';
  lineNumber: number;
  label: string; // Arabic label e.g., "الجزء ٢" or "الحزب ٥" or "الربع"
}

export interface AyahSelection {
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export type AyahActionType = 'play' | 'tafsir' | 'bookmark' | 'copy' | 'share' | 'wordByWord';

export type BookmarkCategory = 'reading' | 'recitation';

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  category: BookmarkCategory;
  createdAt: number; // Date.now()
}

export interface MushafPageData {
  pageNumber: number;
  words: MushafWord[];
  fontBase64: string;
}

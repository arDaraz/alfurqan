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

export interface AyahRange {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
}

export interface LastReadPosition {
  surahNumber: number;
  ayahNumber: number;
  scrollOffset: number;
}

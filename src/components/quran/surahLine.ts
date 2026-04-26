import { SURAH_METADATA } from '../../constants/quran';
import type { MushafWord } from '../../data/types';

const SURAH_AYAH_COUNTS = new Map<number, number>(
  SURAH_METADATA.map((surah) => [surah.number, surah.ayahCount])
);

export function isSurahEndingLine(words: MushafWord[]): boolean {
  const contentWords = words.filter((word) => word.charType === 'word' || word.charType === 'end');
  if (!contentWords.some((word) => word.charType === 'end')) return false;

  const firstWord = contentWords[0];
  if (!firstWord) return false;

  const isSingleAyahLine = contentWords.every(
    (word) =>
      word.surahNumber === firstWord.surahNumber &&
      word.ayahNumber === firstWord.ayahNumber
  );

  return (
    isSingleAyahLine &&
    SURAH_AYAH_COUNTS.get(firstWord.surahNumber) === firstWord.ayahNumber
  );
}

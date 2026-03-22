import { useReadingStore } from '../stores/readingStore';
import type { LastReadPosition } from '../data/types';

export function useLastRead() {
  const lastReadSurah = useReadingStore((s) => s.lastReadSurah);
  const lastReadAyah = useReadingStore((s) => s.lastReadAyah);
  const setLastRead = useReadingStore((s) => s.setLastRead);

  const hasLastRead = lastReadSurah !== null && lastReadAyah !== null;

  const lastRead: LastReadPosition | null = hasLastRead
    ? {
        surahNumber: lastReadSurah!,
        ayahNumber: lastReadAyah!,
      }
    : null;

  const savePosition = (surah: number, ayah: number) => {
    setLastRead(surah, ayah);
  };

  return { lastRead, savePosition, hasLastRead };
}

import { useReadingStore } from '../stores/readingStore';
import type { LastReadPosition } from '../data/types';

export function useLastRead() {
  const lastReadSurah = useReadingStore((s) => s.lastReadSurah);
  const lastReadAyah = useReadingStore((s) => s.lastReadAyah);
  const lastReadPage = useReadingStore((s) => s.lastReadPage);
  const setLastRead = useReadingStore((s) => s.setLastRead);
  const setLastReadPage = useReadingStore((s) => s.setLastReadPage);

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

  const savePagePosition = (page: number) => {
    setLastReadPage(page);
  };

  return { lastRead, savePosition, hasLastRead, lastReadPage, savePagePosition };
}

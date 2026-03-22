import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMMKVStorage } from 'zustand-mmkv-storage';

const mmkvStorage = createMMKVStorage({ id: 'reading-store' });

interface ReadingState {
  lastReadSurah: number | null;
  lastReadAyah: number | null;
  lastReadScrollOffset: number;
  hasCompletedOnboarding: boolean;
  setLastRead: (surah: number, ayah: number, offset: number) => void;
  completeOnboarding: () => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set) => ({
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadScrollOffset: 0,
      hasCompletedOnboarding: false,
      setLastRead: (surah, ayah, offset) =>
        set({ lastReadSurah: surah, lastReadAyah: ayah, lastReadScrollOffset: offset }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'reading-store',
      storage: mmkvStorage,
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMMKVStorage } from 'zustand-mmkv-storage';

const mmkvStorage = createMMKVStorage({ id: 'reading-store' });

interface ReadingState {
  lastReadSurah: number | null;
  lastReadAyah: number | null;
  hasCompletedOnboarding: boolean;
  setLastRead: (surah: number, ayah: number) => void;
  completeOnboarding: () => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set) => ({
      lastReadSurah: null,
      lastReadAyah: null,
      hasCompletedOnboarding: false,
      setLastRead: (surah, ayah) =>
        set({ lastReadSurah: surah, lastReadAyah: ayah }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'reading-store',
      storage: mmkvStorage,
    }
  )
);

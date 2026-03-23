import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const mmkv = createMMKV({ id: 'reading-store' });

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  getItem: (name) => {
    return mmkv.getString(name) ?? null;
  },
  removeItem: (name) => {
    mmkv.remove(name);
  },
};

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
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

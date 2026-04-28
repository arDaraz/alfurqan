import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { Bookmark } from '../data/types';

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
  lastReadPage: number | null;
  lastReadJuz: number | null;
  lastReadAt: number | null;
  hasCompletedOnboarding: boolean;
  bookmarks: Bookmark[];
  setLastRead: (
    surah: number,
    ayah: number,
    juz: number,
    page: number,
    now?: Date
  ) => void;
  completeOnboarding: () => void;
  addBookmark: (surah: number, ayah: number) => void;
  removeBookmark: (surah: number, ayah: number) => void;
  toggleBookmark: (surah: number, ayah: number) => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadPage: null,
      lastReadJuz: null,
      lastReadAt: null,
      hasCompletedOnboarding: false,
      bookmarks: [],
      setLastRead: (surah, ayah, juz, page, now = new Date()) =>
        set({
          lastReadSurah: surah,
          lastReadAyah: ayah,
          lastReadJuz: juz,
          lastReadPage: page,
          lastReadAt: now.getTime(),
        }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      addBookmark: (surah, ayah) => {
        const exists = get().bookmarks.some(
          (b) => b.surahNumber === surah && b.ayahNumber === ayah
        );
        if (!exists) {
          set({
            bookmarks: [
              ...get().bookmarks,
              { surahNumber: surah, ayahNumber: ayah, createdAt: Date.now() },
            ],
          });
        }
      },
      removeBookmark: (surah, ayah) =>
        set({
          bookmarks: get().bookmarks.filter(
            (b) => !(b.surahNumber === surah && b.ayahNumber === ayah)
          ),
        }),
      toggleBookmark: (surah, ayah) => {
        const exists = get().bookmarks.some(
          (b) => b.surahNumber === surah && b.ayahNumber === ayah
        );
        if (exists) {
          get().removeBookmark(surah, ayah);
        } else {
          get().addBookmark(surah, ayah);
        }
      },
    }),
    {
      name: 'reading-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

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
  streakDays: number;
  streakLastReadDate: string | null;
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

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nextStreak(previousDays: number, previousDate: string | null, today: string): number {
  if (previousDate === today) return previousDays || 1;
  if (previousDate === null) return 1;

  const previousMs = new Date(`${previousDate}T00:00:00`).getTime();
  const todayMs = new Date(`${today}T00:00:00`).getTime();
  const diffDays = Math.round((todayMs - previousMs) / 86_400_000);

  return diffDays === 1 ? previousDays + 1 : 1;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadPage: null,
      lastReadJuz: null,
      lastReadAt: null,
      streakDays: 0,
      streakLastReadDate: null,
      hasCompletedOnboarding: false,
      bookmarks: [],
      setLastRead: (surah, ayah, juz, page, now = new Date()) => {
        const today = localDateKey(now);
        const { streakDays, streakLastReadDate } = get();
        set({
          lastReadSurah: surah,
          lastReadAyah: ayah,
          lastReadJuz: juz,
          lastReadPage: page,
          lastReadAt: now.getTime(),
          streakDays: nextStreak(streakDays, streakLastReadDate, today),
          streakLastReadDate: today,
        });
      },
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

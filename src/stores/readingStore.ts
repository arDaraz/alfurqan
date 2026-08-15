import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { Bookmark, BookmarkCategory } from '../data/types';
import {
  DEFAULT_MUSHAF_LAYOUT_ID,
  type MushafLayoutId,
} from '../data/mushafLayouts';

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
  lastReadWordPosition: number | null;
  /** Compatibility cache for existing UI; canonical surah+ayah is authoritative. */
  lastReadPage: number | null;
  lastReadPageByLayout: Partial<Record<MushafLayoutId, number>>;
  lastReadJuz: number | null;
  lastReadAt: number | null;
  streakDays: number;
  streakLastReadDate: string | null;
  longestStreak: number;
  hasCompletedOnboarding: boolean;
  bookmarks: Bookmark[];
  setLastRead: (
    surah: number,
    ayah: number,
    juz: number,
    page: number,
    now?: Date,
    layoutId?: MushafLayoutId,
    wordPosition?: number | null
  ) => void;
  getCachedPage: (layoutId: MushafLayoutId) => number | null;
  completeOnboarding: () => void;
  /** Pass `createdAt` only when restoring a removed bookmark, so Undo keeps its list position. */
  addBookmark: (
    surah: number,
    ayah: number,
    category: BookmarkCategory,
    createdAt?: number
  ) => void;
  removeBookmark: (surah: number, ayah: number, category: BookmarkCategory) => void;
  toggleBookmark: (surah: number, ayah: number, category: BookmarkCategory) => void;
  /**
   * Returns a fresh array on every call. Safe to read via `useReadingStore.getState()`
   * or inside `useMemo`. Do NOT subscribe via `useReadingStore((s) => s.getBookmarkCategories(...))`
   * — the new array reference will trigger re-renders on every unrelated store update.
   * Subscribe to `bookmarks` and call this getter inline if you need reactivity.
   */
  getBookmarkCategories: (surah: number, ayah: number) => BookmarkCategory[];
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

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`).getTime();
  const to = new Date(`${toKey}T00:00:00`).getTime();
  return Math.round((to - from) / 86_400_000);
}

/**
 * Which of the last seven days (oldest first, today last) fall inside the
 * current streak. Derived from the streak counter, so no per-day log is kept.
 */
export function weekActivity(
  streakDays: number,
  streakLastReadDate: string | null,
  now: Date = new Date()
): boolean[] {
  const today = localDateKey(now);
  if (streakLastReadDate === null || streakDays <= 0) return Array(7).fill(false);

  const lastReadOffset = daysBetween(streakLastReadDate, today);
  return Array.from({ length: 7 }, (_, i) => {
    const offsetFromToday = 6 - i;
    const offsetFromLastRead = offsetFromToday - lastReadOffset;
    return offsetFromLastRead >= 0 && offsetFromLastRead < streakDays;
  });
}

export function migrate(state: any, version: number): any {
  if (!state || typeof state !== 'object') return state;
  let migratedState = { ...state };
  if (version < 1 && Array.isArray(state.bookmarks)) {
    const bookmarks = state.bookmarks.map((b: any) =>
      b && typeof b === 'object' && !b.category ? { ...b, category: 'reading' } : b
    );
    migratedState = { ...migratedState, bookmarks };
  }
  if (version < 2) {
    migratedState = {
      ...migratedState,
      lastReadWordPosition: migratedState.lastReadWordPosition ?? null,
      lastReadPageByLayout:
        migratedState.lastReadPage != null
          ? { [DEFAULT_MUSHAF_LAYOUT_ID]: migratedState.lastReadPage }
          : {},
    };
  }
  if (version < 3) {
    // No history to reconstruct a real record from, so the current run is the best we know.
    migratedState = {
      ...migratedState,
      longestStreak: migratedState.longestStreak ?? migratedState.streakDays ?? 0,
    };
  }
  return migratedState;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadWordPosition: null,
      lastReadPage: null,
      lastReadPageByLayout: {},
      lastReadJuz: null,
      lastReadAt: null,
      streakDays: 0,
      streakLastReadDate: null,
      longestStreak: 0,
      hasCompletedOnboarding: false,
      bookmarks: [],
      setLastRead: (
        surah,
        ayah,
        juz,
        page,
        now = new Date(),
        layoutId = DEFAULT_MUSHAF_LAYOUT_ID,
        wordPosition = null
      ) => {
        const today = localDateKey(now);
        const { streakDays, streakLastReadDate, longestStreak, lastReadPageByLayout } = get();
        const nextStreakDays = nextStreak(streakDays, streakLastReadDate, today);
        set({
          lastReadSurah: surah,
          lastReadAyah: ayah,
          lastReadWordPosition: wordPosition,
          lastReadJuz: juz,
          lastReadPage: page,
          lastReadPageByLayout: { ...lastReadPageByLayout, [layoutId]: page },
          lastReadAt: now.getTime(),
          streakDays: nextStreakDays,
          streakLastReadDate: today,
          longestStreak: Math.max(longestStreak, nextStreakDays),
        });
      },
      getCachedPage: (layoutId) => get().lastReadPageByLayout[layoutId] ?? null,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      addBookmark: (surah, ayah, category, createdAt) => {
        const exists = get().bookmarks.some(
          (b) =>
            b.surahNumber === surah && b.ayahNumber === ayah && b.category === category
        );
        if (!exists) {
          set({
            bookmarks: [
              ...get().bookmarks,
              {
                surahNumber: surah,
                ayahNumber: ayah,
                category,
                createdAt: createdAt ?? Date.now(),
              },
            ],
          });
        }
      },
      removeBookmark: (surah, ayah, category) =>
        set({
          bookmarks: get().bookmarks.filter(
            (b) =>
              !(b.surahNumber === surah && b.ayahNumber === ayah && b.category === category)
          ),
        }),
      toggleBookmark: (surah, ayah, category) => {
        const exists = get().bookmarks.some(
          (b) =>
            b.surahNumber === surah && b.ayahNumber === ayah && b.category === category
        );
        if (exists) {
          get().removeBookmark(surah, ayah, category);
        } else {
          get().addBookmark(surah, ayah, category);
        }
      },
      getBookmarkCategories: (surah, ayah) =>
        get()
          .bookmarks.filter((b) => b.surahNumber === surah && b.ayahNumber === ayah)
          .map((b) => b.category),
    }),
    {
      name: 'reading-store',
      storage: createJSONStorage(() => mmkvStorage),
      version: 3,
      migrate,
    }
  )
);

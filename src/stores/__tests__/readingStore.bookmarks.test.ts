jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

import { act } from '@testing-library/react-native';
import { useReadingStore } from '../readingStore';
import type { Bookmark } from '../../data/types';

function resetStore() {
  useReadingStore.setState({
    bookmarks: [],
    lastReadSurah: null,
    lastReadAyah: null,
    lastReadPage: null,
    lastReadJuz: null,
    lastReadAt: null,
    streakDays: 0,
    streakLastReadDate: null,
    hasCompletedOnboarding: false,
  } as Partial<ReturnType<typeof useReadingStore.getState>> as any);
}

describe('readingStore bookmarks', () => {
  beforeEach(() => resetStore());

  it('adds a bookmark with category', () => {
    act(() => useReadingStore.getState().addBookmark(2, 255, 'reading'));
    const bms = useReadingStore.getState().bookmarks;
    expect(bms).toHaveLength(1);
    expect(bms[0]).toMatchObject({ surahNumber: 2, ayahNumber: 255, category: 'reading' });
    expect(typeof bms[0].createdAt).toBe('number');
  });

  it('is a no-op when the exact (surah, ayah, category) already exists', () => {
    act(() => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(2, 255, 'reading');
    });
    expect(useReadingStore.getState().bookmarks).toHaveLength(1);
  });

  it('stores the same ayah twice under different categories', () => {
    act(() => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(2, 255, 'recitation');
    });
    const bms = useReadingStore.getState().bookmarks;
    expect(bms).toHaveLength(2);
    expect(bms.map((b) => b.category).sort()).toEqual(['reading', 'recitation']);
  });

  it('removeBookmark filters by category', () => {
    act(() => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(2, 255, 'recitation');
      useReadingStore.getState().removeBookmark(2, 255, 'reading');
    });
    const bms = useReadingStore.getState().bookmarks;
    expect(bms).toHaveLength(1);
    expect(bms[0].category).toBe('recitation');
  });

  it('toggleBookmark is category-scoped', () => {
    act(() => useReadingStore.getState().toggleBookmark(2, 255, 'reading'));
    expect(useReadingStore.getState().bookmarks).toHaveLength(1);
    act(() => useReadingStore.getState().toggleBookmark(2, 255, 'reading'));
    expect(useReadingStore.getState().bookmarks).toHaveLength(0);
    act(() => {
      useReadingStore.getState().toggleBookmark(2, 255, 'reading');
      useReadingStore.getState().toggleBookmark(2, 255, 'recitation');
    });
    expect(useReadingStore.getState().bookmarks).toHaveLength(2);
  });

  it('getBookmarkCategories returns the set of categories for an ayah', () => {
    act(() => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(2, 255, 'recitation');
      useReadingStore.getState().addBookmark(36, 1, 'recitation');
    });
    expect(useReadingStore.getState().getBookmarkCategories(2, 255).sort()).toEqual([
      'reading',
      'recitation',
    ]);
    expect(useReadingStore.getState().getBookmarkCategories(36, 1)).toEqual(['recitation']);
    expect(useReadingStore.getState().getBookmarkCategories(1, 1)).toEqual([]);
  });

  it('migrate(v0 → v1) tags legacy bookmarks with category="reading"', () => {
    const legacy = {
      bookmarks: [
        { surahNumber: 2, ayahNumber: 255, createdAt: 1700000000000 },
        { surahNumber: 36, ayahNumber: 1, createdAt: 1700000000000 },
      ],
    } as any;
    const { migrate } = require('../readingStore') as {
      migrate: (state: any, version: number) => any;
    };
    const migrated: { bookmarks: Bookmark[] } = migrate(legacy, 0);
    expect(migrated.bookmarks).toHaveLength(2);
    expect(migrated.bookmarks.every((b) => b.category === 'reading')).toBe(true);
  });
});

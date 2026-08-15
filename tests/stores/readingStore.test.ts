// Mock react-native-mmkv before imports
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

import { useReadingStore } from '../../src/stores/readingStore';

describe('readingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useReadingStore.setState({
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadPage: null,
      lastReadWordPosition: null,
      lastReadPageByLayout: {},
      lastReadJuz: null,
      lastReadAt: null,
      streakDays: 0,
      streakLastReadDate: null,
      hasCompletedOnboarding: false,
      bookmarks: [],
    });
  });

  it('keeps canonical progress while caching different edition pages', () => {
    const now = new Date('2026-04-29T12:00:00');
    useReadingStore.getState().setLastRead(
      112,
      1,
      30,
      604,
      now,
      'madani-qcf-v2-hafs',
      1
    );
    useReadingStore.getState().setLastRead(
      112,
      1,
      30,
      609,
      now,
      'indopak-15-line-hafs',
      1
    );

    const state = useReadingStore.getState();
    expect(state.lastReadSurah).toBe(112);
    expect(state.lastReadAyah).toBe(1);
    expect(state.lastReadWordPosition).toBe(1);
    expect(state.getCachedPage('madani-qcf-v2-hafs')).toBe(604);
    expect(state.getCachedPage('indopak-15-line-hafs')).toBe(609);
  });

  it('has correct initial state', () => {
    const state = useReadingStore.getState();
    expect(state.lastReadSurah).toBeNull();
    expect(state.lastReadAyah).toBeNull();
    expect(state.lastReadJuz).toBeNull();
    expect(state.lastReadPage).toBeNull();
    expect(state.lastReadAt).toBeNull();
    expect(state.streakDays).toBe(0);
    expect(state.streakLastReadDate).toBeNull();
    expect(state.hasCompletedOnboarding).toBe(false);
  });

  it('setLastRead persists full reading position', () => {
    const now = new Date('2026-04-29T12:00:00');
    useReadingStore.getState().setLastRead(2, 5, 1, 4, now);
    const state = useReadingStore.getState();
    expect(state.lastReadSurah).toBe(2);
    expect(state.lastReadAyah).toBe(5);
    expect(state.lastReadJuz).toBe(1);
    expect(state.lastReadPage).toBe(4);
    expect(state.lastReadAt).toBe(now.getTime());
  });

  it('completeOnboarding sets hasCompletedOnboarding to true', () => {
    useReadingStore.getState().completeOnboarding();
    expect(useReadingStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('setLastRead updates existing values', () => {
    useReadingStore.getState().setLastRead(1, 1, 1, 1);
    useReadingStore.getState().setLastRead(3, 10, 3, 50);
    const state = useReadingStore.getState();
    expect(state.lastReadSurah).toBe(3);
    expect(state.lastReadAyah).toBe(10);
    expect(state.lastReadJuz).toBe(3);
    expect(state.lastReadPage).toBe(50);
  });

  describe('bookmarks', () => {
    it('starts with empty bookmarks array', () => {
      const state = useReadingStore.getState();
      expect(state.bookmarks).toEqual([]);
    });

    it('addBookmark adds a bookmark to the array', () => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      const state = useReadingStore.getState();
      expect(state.bookmarks).toHaveLength(1);
      expect(state.bookmarks[0].surahNumber).toBe(2);
      expect(state.bookmarks[0].ayahNumber).toBe(255);
      expect(state.bookmarks[0].createdAt).toBeGreaterThan(0);
    });

    it('addBookmark is idempotent (no duplicates)', () => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      const state = useReadingStore.getState();
      expect(state.bookmarks).toHaveLength(1);
    });

    it('removeBookmark removes a bookmark by surah+ayah', () => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().addBookmark(3, 1, 'reading');
      useReadingStore.getState().removeBookmark(2, 255, 'reading');
      const state = useReadingStore.getState();
      expect(state.bookmarks).toHaveLength(1);
      expect(state.bookmarks[0].surahNumber).toBe(3);
    });

    it('removeBookmark on non-existent is no-op', () => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().removeBookmark(99, 1, 'reading');
      const state = useReadingStore.getState();
      expect(state.bookmarks).toHaveLength(1);
    });

    it('toggleBookmark adds when not present', () => {
      useReadingStore.getState().toggleBookmark(2, 255, 'reading');
      const state = useReadingStore.getState();
      expect(state.bookmarks).toHaveLength(1);
      expect(state.bookmarks[0].surahNumber).toBe(2);
      expect(state.bookmarks[0].ayahNumber).toBe(255);
    });

    it('toggleBookmark removes when present', () => {
      useReadingStore.getState().addBookmark(2, 255, 'reading');
      useReadingStore.getState().toggleBookmark(2, 255, 'reading');
      const state = useReadingStore.getState();
      expect(state.bookmarks).toHaveLength(0);
    });
  });
});

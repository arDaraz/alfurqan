jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(() => null),
    remove: jest.fn(),
  })),
}));

import { useReadingStore } from '../readingStore';

function reset() {
  useReadingStore.setState({
    lastReadSurah: null,
    lastReadAyah: null,
    lastReadPage: null,
    lastReadJuz: null,
    lastReadAt: null,
    hasCompletedOnboarding: false,
    bookmarks: [],
  });
}

describe('readingStore activity', () => {
  beforeEach(reset);

  it('caches a full reading position transactionally', () => {
    const now = new Date('2026-04-29T12:00:00');

    useReadingStore.getState().setLastRead(2, 255, 3, 42, now);

    expect(useReadingStore.getState()).toMatchObject({
      lastReadSurah: 2,
      lastReadAyah: 255,
      lastReadJuz: 3,
      lastReadPage: 42,
      lastReadAt: now.getTime(),
    });
  });

  it('does not create or mutate bookmarks when reading activity changes', () => {
    useReadingStore.getState().addBookmark(18, 10);
    const before = useReadingStore.getState().bookmarks;

    useReadingStore.getState().setLastRead(2, 255, 3, 42, new Date('2026-04-29T12:00:00'));

    expect(useReadingStore.getState().bookmarks).toEqual(before);
  });
});

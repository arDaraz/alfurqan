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
    streakDays: 0,
    streakLastReadDate: null,
    hasCompletedOnboarding: false,
    bookmarks: [],
  });
}

const day = (iso: string) => new Date(`${iso}T12:00:00`);

describe('readingStore streak', () => {
  beforeEach(reset);

  it('starts at 1 on first read', () => {
    useReadingStore.getState().setLastRead(2, 255, 3, 42, day('2026-04-29'));

    expect(useReadingStore.getState()).toMatchObject({
      streakDays: 1,
      streakLastReadDate: '2026-04-29',
    });
  });

  it('does not increment on same-day re-read', () => {
    useReadingStore.getState().setLastRead(2, 255, 3, 42, day('2026-04-29'));
    useReadingStore.getState().setLastRead(2, 256, 3, 42, day('2026-04-29'));

    expect(useReadingStore.getState().streakDays).toBe(1);
  });

  it('increments on a consecutive local day', () => {
    useReadingStore.getState().setLastRead(2, 255, 3, 42, day('2026-04-29'));
    useReadingStore.getState().setLastRead(2, 260, 3, 42, day('2026-04-30'));

    expect(useReadingStore.getState().streakDays).toBe(2);
  });

  it('resets after a skipped local day', () => {
    useReadingStore.getState().setLastRead(2, 255, 3, 42, day('2026-04-29'));
    useReadingStore.getState().setLastRead(2, 260, 3, 42, day('2026-05-01'));

    expect(useReadingStore.getState().streakDays).toBe(1);
  });
});

// Mock react-native-mmkv and zustand-mmkv-storage before imports
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('zustand-mmkv-storage', () => ({
  createMMKVStorage: jest.fn(() => ({
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

import { useReadingStore } from '../../src/stores/readingStore';

describe('readingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useReadingStore.setState({
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadScrollOffset: 0,
      hasCompletedOnboarding: false,
    });
  });

  it('has correct initial state', () => {
    const state = useReadingStore.getState();
    expect(state.lastReadSurah).toBeNull();
    expect(state.lastReadAyah).toBeNull();
    expect(state.lastReadScrollOffset).toBe(0);
    expect(state.hasCompletedOnboarding).toBe(false);
  });

  it('setLastRead persists surah, ayah, and offset', () => {
    useReadingStore.getState().setLastRead(2, 5, 120.5);
    const state = useReadingStore.getState();
    expect(state.lastReadSurah).toBe(2);
    expect(state.lastReadAyah).toBe(5);
    expect(state.lastReadScrollOffset).toBe(120.5);
  });

  it('completeOnboarding sets hasCompletedOnboarding to true', () => {
    useReadingStore.getState().completeOnboarding();
    expect(useReadingStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('setLastRead updates existing values', () => {
    useReadingStore.getState().setLastRead(1, 1, 0);
    useReadingStore.getState().setLastRead(3, 10, 500);
    const state = useReadingStore.getState();
    expect(state.lastReadSurah).toBe(3);
    expect(state.lastReadAyah).toBe(10);
    expect(state.lastReadScrollOffset).toBe(500);
  });
});

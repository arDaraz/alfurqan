// Mock react-native-mmkv before any store imports
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

// Mock quranRepository
jest.mock('../../src/data/quranRepository', () => ({
  getAyahTextRange: jest.fn().mockResolvedValue('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'),
}));

import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { handleAyahAction } from '../../src/actions/ayahActions';
import { getAyahTextRange } from '../../src/data/quranRepository';
import { useReadingStore } from '../../src/stores/readingStore';
import type { AyahSelection } from '../../src/data/types';

const mockSelection: AyahSelection = {
  startSurah: 1,
  startAyah: 1,
  endSurah: 1,
  endAyah: 3,
};

describe('handleAyahAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useReadingStore.setState({ bookmarks: [] });
  });

  describe('copy action', () => {
    it('fetches ayah text and copies to clipboard', async () => {
      await handleAyahAction('copy', mockSelection);

      expect(getAyahTextRange).toHaveBeenCalledWith(1, 1, 3);
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
        'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
      );
    });
  });

  describe('share action', () => {
    it('fetches ayah text and opens share sheet', async () => {
      const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
      await handleAyahAction('share', mockSelection);

      expect(getAyahTextRange).toHaveBeenCalledWith(1, 1, 3);
      expect(shareSpy).toHaveBeenCalledWith({
        message: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      });
      shareSpy.mockRestore();
    });
  });

  describe('bookmark action', () => {
    it('calls toggleBookmark on readingStore', async () => {
      await handleAyahAction('bookmark', mockSelection);

      // Verify bookmark was toggled by checking store state
      const state = useReadingStore.getState();
      expect(state.bookmarks).toHaveLength(1);
      expect(state.bookmarks[0].surahNumber).toBe(1);
      expect(state.bookmarks[0].ayahNumber).toBe(1);
    });
  });

  describe('placeholder actions', () => {
    it('play action logs to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await handleAyahAction('play', mockSelection);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AyahAction] play')
      );
      consoleSpy.mockRestore();
    });

    it('tafsir action logs to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await handleAyahAction('tafsir', mockSelection);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AyahAction] tafsir')
      );
      consoleSpy.mockRestore();
    });

    it('wordByWord action logs to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await handleAyahAction('wordByWord', mockSelection);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AyahAction] wordByWord')
      );
      consoleSpy.mockRestore();
    });
  });
});

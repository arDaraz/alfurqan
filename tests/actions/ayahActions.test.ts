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
  getJuzAndPageForAyah: jest.fn().mockResolvedValue({ juz: 3, page: 51 }),
  getSurahLastAyah: jest.fn().mockResolvedValue(7),
}));

jest.mock('../../src/services/recitationEngine', () => ({
  recitationEngine: {
    start: jest.fn().mockResolvedValue(undefined),
  },
}));

import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { handleAyahAction } from '../../src/actions/ayahActions';
import {
  getAyahTextRange,
  getJuzAndPageForAyah,
  getSurahLastAyah,
} from '../../src/data/quranRepository';
import { recitationEngine } from '../../src/services/recitationEngine';
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
    useReadingStore.setState({
      bookmarks: [],
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadJuz: null,
      lastReadPage: null,
      lastReadAt: null,
      streakDays: 0,
      streakLastReadDate: null,
    });
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
    it('invokes onRequestBookmark with the selection', async () => {
      const onRequestBookmark = jest.fn();
      await handleAyahAction('bookmark', mockSelection, { onRequestBookmark });
      expect(onRequestBookmark).toHaveBeenCalledTimes(1);
      expect(onRequestBookmark).toHaveBeenCalledWith(mockSelection);
    });

    it('updates last-read position via setLastRead even on bookmark', async () => {
      await handleAyahAction('bookmark', mockSelection, { onRequestBookmark: jest.fn() });
      const state = useReadingStore.getState();
      expect(state.lastReadSurah).toBe(mockSelection.startSurah);
      expect(state.lastReadAyah).toBe(mockSelection.startAyah);
      expect(state.lastReadJuz).toBe(3);
      expect(state.lastReadPage).toBe(51);
    });

    it('does not mutate bookmarks directly; defers to the callback', async () => {
      const onRequestBookmark = jest.fn();
      await handleAyahAction('bookmark', mockSelection, { onRequestBookmark });
      expect(useReadingStore.getState().bookmarks).toEqual([]);
      expect(onRequestBookmark).toHaveBeenCalledTimes(1);
    });

    it('still updates last-read and logs a warning when called without onRequestBookmark', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      await handleAyahAction('bookmark', mockSelection);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('onRequestBookmark'),
      );
      const state = useReadingStore.getState();
      expect(state.lastReadSurah).toBe(mockSelection.startSurah);
      expect(state.lastReadAyah).toBe(mockSelection.startAyah);
      warnSpy.mockRestore();
    });
  });

  describe('placeholder actions', () => {
    it('play action starts recitation from selected ayah to end of surah', async () => {
      await handleAyahAction('play', mockSelection);
      expect(getSurahLastAyah).toHaveBeenCalledWith(1);
      expect(recitationEngine.start).toHaveBeenCalledWith({
        surah: 1,
        startAyah: 1,
        stopAyah: 7,
        trigger: 'popup',
        selectedEndSurah: 1,
        selectedEndAyah: 3,
      });
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

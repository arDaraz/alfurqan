import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import {
  getMushafJuzAndPageForAyah,
  getMushafPageForAyah,
  getSurahLastAyah,
  getMushafTopAyahForPage,
} from '../../../data/quranRepository';
import { recitationEngine } from '../../../services/recitationEngine';
import { useRecitationStore } from '../../../stores/recitationStore';
import { useReadingStore } from '../../../stores/readingStore';
import { MushafReader, startToolbarRecitationFromPage } from '../MushafReader';

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('../MushafPage', () => ({
  MushafPage: () => null,
}));

jest.mock('../MiniPlayerBar', () => ({
  MiniPlayerBar: () => null,
}));

jest.mock('../MushafBottomToolbar', () => ({
  MushafBottomToolbar: () => null,
}));

jest.mock('../BookmarkSavedSnackbar', () => ({
  BookmarkSavedSnackbar: () => null,
}));

jest.mock('../../../data/quranRepository', () => ({
  getMushafJuzAndPageForAyah: jest.fn(),
  getMushafPageForAyah: jest.fn(),
  getSurahByNumber: jest.fn().mockResolvedValue(null),
  getSurahLastAyah: jest.fn(),
  getMushafTopAyahForPage: jest.fn(),
}));

jest.mock('../../../services/recitationEngine', () => ({
  recitationEngine: {
    resume: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
  },
}));

const getPageForAyahMock = getMushafPageForAyah as jest.MockedFunction<typeof getMushafPageForAyah>;
const getJuzAndPageForAyahMock = getMushafJuzAndPageForAyah as jest.MockedFunction<typeof getMushafJuzAndPageForAyah>;
const getTopAyahForPageMock = getMushafTopAyahForPage as jest.MockedFunction<typeof getMushafTopAyahForPage>;
const getSurahLastAyahMock = getSurahLastAyah as jest.MockedFunction<typeof getSurahLastAyah>;

describe('startToolbarRecitationFromPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRecitationStore.getState()._reset();
    getTopAyahForPageMock.mockResolvedValue({ surahNumber: 2, ayahNumber: 6, wordPosition: 1 });
    getSurahLastAyahMock.mockResolvedValue(286);
  });

  it('starts a toolbar session from the current page top ayah when idle', async () => {
    await startToolbarRecitationFromPage(2);

    expect(getMushafTopAyahForPage).toHaveBeenCalledWith('madani-qcf-v2-hafs', 2);
    expect(getSurahLastAyah).toHaveBeenCalledWith(2);
    expect(recitationEngine.start).toHaveBeenCalledWith({
      surah: 2,
      startAyah: 6,
      stopAyah: 286,
      trigger: 'toolbar',
    });
  });

  it('resumes instead of starting a new session while paused', async () => {
    useRecitationStore.getState()._setState('paused');

    await startToolbarRecitationFromPage(3);

    expect(recitationEngine.resume).toHaveBeenCalledTimes(1);
    expect(recitationEngine.start).not.toHaveBeenCalled();
    expect(getMushafTopAyahForPage).not.toHaveBeenCalled();
  });

  it('does not start a duplicate session while already playing', async () => {
    useRecitationStore.getState()._setState('playing');

    await startToolbarRecitationFromPage(4);

    expect(recitationEngine.resume).not.toHaveBeenCalled();
    expect(recitationEngine.start).not.toHaveBeenCalled();
    expect(getMushafTopAyahForPage).not.toHaveBeenCalled();
  });

  it('starts a fresh toolbar session from error state', async () => {
    useRecitationStore.getState()._setError('network', 'offline');

    await startToolbarRecitationFromPage(2);

    expect(recitationEngine.start).toHaveBeenCalledWith({
      surah: 2,
      startAyah: 6,
      stopAyah: 286,
      trigger: 'toolbar',
    });
  });
});

describe('MushafReader recitation page sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRecitationStore.getState()._reset();
    getPageForAyahMock.mockResolvedValue(2);
    getJuzAndPageForAyahMock.mockResolvedValue({ juz: 1, page: 2 });
  });

  it('moves the pager to the page containing the currently playing ayah', async () => {
    const onPageChange = jest.fn();
    render(<MushafReader initialPage={1} onPageChange={onPageChange} />);

    act(() => {
      const store = useRecitationStore.getState();
      store._setSession({ surah: 2, startAyah: 1, stopAyah: 286, trigger: 'toolbar' }, 1);
      store._setState('playing');
    });

    await waitFor(() =>
      expect(getPageForAyahMock).toHaveBeenCalledWith('madani-qcf-v2-hafs', 2, 1)
    );
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('preserves an exact canonical location when the selected layout opens its page', async () => {
    getTopAyahForPageMock.mockResolvedValue({
      surahNumber: 109,
      ayahNumber: 3,
      wordPosition: 1,
    });
    getJuzAndPageForAyahMock.mockImplementation(async () => ({
      juz: 30,
      page: 609,
    }));

    render(
      <MushafReader
        initialPage={609}
        initialLocation={{ surahNumber: 112, ayahNumber: 1 }}
        layoutId="indopak-15-line-hafs"
      />
    );

    await waitFor(() => {
      expect(useReadingStore.getState()).toMatchObject({
        lastReadSurah: 112,
        lastReadAyah: 1,
        lastReadPage: 609,
        lastReadJuz: 30,
      });
    });
  });
});

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

const mockSetPage = jest.fn();

jest.mock('react-native-pager-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        setPage: mockSetPage,
      }));
      return <View {...props} />;
    }),
  };
});

jest.mock('../MushafPage', () => ({
  MushafPage: () => null,
}));

jest.mock('../MiniPlayerBar', () => ({
  MiniPlayerBar: () => null,
}));

jest.mock('../MushafBottomToolbar', () => ({
  MushafBottomToolbar: () => null,
}));

jest.mock('../../../data/quranRepository', () => ({
  getJuzAndPageForAyah: jest.fn(),
  getPageForAyah: jest.fn(),
  getSurahLastAyah: jest.fn(),
  getTopAyahForPage: jest.fn(),
}));

jest.mock('../../../services/recitationEngine', () => ({
  recitationEngine: {
    resume: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
  },
}));

import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import {
  getJuzAndPageForAyah,
  getPageForAyah,
  getSurahLastAyah,
  getTopAyahForPage,
} from '../../../data/quranRepository';
import { recitationEngine } from '../../../services/recitationEngine';
import { useRecitationStore } from '../../../stores/recitationStore';
import { MushafReader, startToolbarRecitationFromPage } from '../MushafReader';

const getPageForAyahMock = getPageForAyah as jest.MockedFunction<typeof getPageForAyah>;
const getJuzAndPageForAyahMock = getJuzAndPageForAyah as jest.MockedFunction<typeof getJuzAndPageForAyah>;
const getTopAyahForPageMock = getTopAyahForPage as jest.MockedFunction<typeof getTopAyahForPage>;
const getSurahLastAyahMock = getSurahLastAyah as jest.MockedFunction<typeof getSurahLastAyah>;

describe('startToolbarRecitationFromPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRecitationStore.getState()._reset();
    getTopAyahForPageMock.mockResolvedValue({ surahNumber: 2, ayahNumber: 6 });
    getSurahLastAyahMock.mockResolvedValue(286);
  });

  it('starts a toolbar session from the current page top ayah when idle', async () => {
    await startToolbarRecitationFromPage(2);

    expect(getTopAyahForPage).toHaveBeenCalledWith(2);
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
    expect(getTopAyahForPage).not.toHaveBeenCalled();
  });

  it('does not start a duplicate session while already playing', async () => {
    useRecitationStore.getState()._setState('playing');

    await startToolbarRecitationFromPage(4);

    expect(recitationEngine.resume).not.toHaveBeenCalled();
    expect(recitationEngine.start).not.toHaveBeenCalled();
    expect(getTopAyahForPage).not.toHaveBeenCalled();
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
    mockSetPage.mockClear();
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

    await waitFor(() => expect(getPageForAyahMock).toHaveBeenCalledWith(2, 1));
    await waitFor(() => expect(mockSetPage).toHaveBeenCalledWith(1));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

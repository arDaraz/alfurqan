const mockSetLastRead = jest.fn();
const mockGetJuzAndPageForAyah = jest.fn();

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('../../../src/data/quranRepository', () => ({
  getJuzAndPageForAyah: (...args: unknown[]) => mockGetJuzAndPageForAyah(...args),
}));

jest.mock('../../../src/stores/readingStore', () => ({
  useReadingStore: (selector: (state: { setLastRead: jest.Mock }) => unknown) =>
    selector({ setLastRead: mockSetLastRead }),
}));

jest.mock('../../../src/components/quran/SurahHeaderBanner', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    SurahHeaderBanner: () => <Text>Surah header</Text>,
  };
});

jest.mock('../../../src/components/quran/Bismillah', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Bismillah: () => <Text>Bismillah</Text>,
  };
});

jest.mock('../../../src/components/quran/RangeSelectionBar', () => ({
  RangeSelectionBar: () => null,
}));

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QuranReader } from '../../../src/components/quran/QuranReader';
import type { Ayah, Surah } from '../../../src/data/types';

const surah: Surah = {
  number: 1,
  nameArabic: 'الفاتحة',
  nameEnglish: 'Al-Fatihah',
  ayahCount: 7,
  revelationType: 'Makki',
  revelationOrder: 5,
  juzStart: 1,
};

const ayahs: Ayah[] = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  surahNumber: 1,
  ayahNumber: index + 1,
  textUthmani: `ayah ${index + 1}`,
  textSimple: `ayah ${index + 1}`,
  pageNumber: 1,
  juzNumber: 1,
  hizbNumber: 1,
  rubNumber: 1,
  sajda: false,
}));

describe('QuranReader reading activity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSetLastRead.mockClear();
    mockGetJuzAndPageForAyah.mockReset();
    mockGetJuzAndPageForAyah.mockResolvedValue({ juz: 1, page: 1 });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('persists the first visible ayah when opened from cold start', async () => {
    render(<QuranReader surahNumber={1} surah={surah} ayahs={ayahs} />);

    await waitFor(() => {
      expect(mockSetLastRead).toHaveBeenCalledWith(1, 1, 1, 1);
    });
  });

  it('persists an estimated visible ayah after scrolling', async () => {
    render(<QuranReader surahNumber={1} surah={surah} ayahs={ayahs} />);

    const scrollView = screen.getByTestId('quran-reader-scroll');
    fireEvent(scrollView, 'layout', { nativeEvent: { layout: { height: 400 } } });
    fireEvent(scrollView, 'contentSizeChange', 400, 1200);
    fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { y: 800 } } });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockSetLastRead).toHaveBeenCalledWith(1, 7, 1, 1);
    });
  });
});

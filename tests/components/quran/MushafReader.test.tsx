const mockMushafPageProps: Record<string, any>[] = [];
const mockSetLastRead = jest.fn();
const mockGetTopAyahForPage = jest.fn();
const mockGetJuzAndPageForAyah = jest.fn();

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

const mockSetPageWithoutAnimation = jest.fn();

jest.mock('react-native-pager-view', () => {
  const React = require('react');
  const { View } = require('react-native');

  // The reader now moves the pager through this method instead of remounting it,
  // so the mock has to carry it on the ref.
  return React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({
      setPageWithoutAnimation: mockSetPageWithoutAnimation,
    }));
    return <View testID="pager-view" {...props} />;
  });
});

jest.mock('../../../src/data/quranRepository', () => ({
  getMushafTopAyahForPage: (...args: unknown[]) => mockGetTopAyahForPage(...args),
  getMushafJuzAndPageForAyah: (...args: unknown[]) => mockGetJuzAndPageForAyah(...args),
  getMushafPageForAyah: jest.fn(),
  getSurahByNumber: jest.fn().mockResolvedValue(null),
  getSurahLastAyah: jest.fn(),
}));

jest.mock('../../../src/components/quran/BookmarkSavedSnackbar', () => ({
  BookmarkSavedSnackbar: () => null,
}));

jest.mock('../../../src/components/quran/MushafPage', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    MushafPage: (props: Record<string, any>) => {
      mockMushafPageProps.push(props);
      return <View testID={`mushaf-page-${props.pageNumber}`} />;
    },
  };
});

jest.mock('../../../src/components/quran/AyahPopup', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    AyahPopup: () => <View testID="ayah-popup" />,
  };
});

jest.mock('../../../src/components/quran/PageIndicator', () => ({
  PageIndicator: () => {
    const React = require('react');
    const { View } = require('react-native');
    return <View testID="page-indicator" />;
  },
}));

jest.mock('../../../src/hooks/useReaderColors', () => ({
  useReaderColors: () => ({
    colors: {
      accent: '#B8923F',
      bg: '#F5EEDB',
    },
  }),
}));

const mockAddBookmark = jest.fn();
const mockRemoveBookmark = jest.fn();

jest.mock('../../../src/stores/readingStore', () => ({
  useReadingStore: (
    selector: (state: {
      setLastRead: jest.Mock;
      bookmarks: unknown[];
      addBookmark: jest.Mock;
      removeBookmark: jest.Mock;
    }) => unknown
  ) =>
    selector({
      setLastRead: mockSetLastRead,
      bookmarks: [],
      addBookmark: mockAddBookmark,
      removeBookmark: mockRemoveBookmark,
    }),
}));

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import {
  getMushafPageWindow,
  MushafReader,
} from '../../../src/components/quran/MushafReader';

const selectEvent = (openMenu: boolean) => ({
  type: 'select',
  startSurah: 2,
  startAyah: 1,
  endSurah: 2,
  endAyah: 1,
  x: 100,
  y: 200,
  openMenu,
});

describe('MushafReader', () => {
  beforeEach(() => {
    mockMushafPageProps.length = 0;
    mockSetLastRead.mockClear();
    mockGetTopAyahForPage.mockReset();
    mockGetJuzAndPageForAyah.mockReset();
    mockGetTopAyahForPage.mockResolvedValue({ surahNumber: 2, ayahNumber: 1, wordPosition: 1 });
    mockGetJuzAndPageForAyah.mockResolvedValue({ juz: 1, page: 1 });
  });

  it('persists reading activity for the initially opened page', async () => {
    render(<MushafReader initialPage={1} />);

    await waitFor(() => {
      expect(mockSetLastRead).toHaveBeenCalledWith(
        2,
        1,
        1,
        1,
        expect.any(Date),
        'madani-qcf-v2-hafs',
        1
      );
    });
  });

  it('keeps a tapped ayah selected without opening the action popup', () => {
    render(<MushafReader initialPage={1} />);

    const currentPage = mockMushafPageProps.find((props) => props.pageNumber === 1);
    act(() => currentPage?.onSelectionEvent(selectEvent(false)));

    expect(screen.queryByTestId('ayah-popup')).toBeNull();
  });

  it('opens the action popup for a long-pressed ayah selection', () => {
    render(<MushafReader initialPage={1} />);

    const currentPage = mockMushafPageProps.find((props) => props.pageNumber === 1);
    act(() => currentPage?.onSelectionEvent(selectEvent(true)));

    expect(screen.getByTestId('ayah-popup')).toBeTruthy();
  });

  it('does not render the duplicate bottom page indicator', () => {
    render(<MushafReader initialPage={1} />);

    expect(screen.queryByTestId('page-indicator')).toBeNull();
  });

  it('keeps only a three-page native window at the start, middle, and end', () => {
    expect(getMushafPageWindow(1, 604)).toEqual({ pages: [1, 2, 3], selectedIndex: 0 });
    expect(getMushafPageWindow(42, 604)).toEqual({ pages: [41, 42, 43], selectedIndex: 1 });
    expect(getMushafPageWindow(604, 604)).toEqual({
      pages: [602, 603, 604],
      selectedIndex: 2,
    });
    expect(getMushafPageWindow(610, 610)).toEqual({
      pages: [608, 609, 610],
      selectedIndex: 2,
    });
  });
});

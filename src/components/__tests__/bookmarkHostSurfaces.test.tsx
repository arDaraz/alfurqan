/**
 * A host may choose where the bookmark surfaces appear. It may not choose
 * whether they appear. Search once rendered the category sheet without the
 * confirmation, so bookmarking there could not be undone while the identical
 * sheet on the reader could. Each host is rendered here with a flow that has
 * both surfaces open, and must show both.
 */
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: any) => <View {...props} />,
      createAnimatedComponent: (C: any) => C,
    },
    createAnimatedComponent: (C: any) => C,
    SlideInDown: { duration: () => ({}) },
    SlideOutDown: { duration: () => ({}) },
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    withRepeat: (v: unknown) => v,
    withSequence: (v: unknown) => v,
    Easing: { linear: () => ({}), inOut: () => ({}), ease: {} },
  };
});

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
}));

const SHEET_ID = 'sheet-surface';
const SNACKBAR_ID = 'snackbar-surface';

jest.mock('../quran/BookmarkCategorySheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BookmarkCategorySheet: () => <View testID="sheet-surface" /> };
});

jest.mock('../quran/BookmarkSavedSnackbar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BookmarkSavedSnackbar: () => <View testID="snackbar-surface" /> };
});

jest.mock('../../hooks/useBookmarkFlow', () => ({
  useBookmarkFlow: () => ({
    requestBookmark: jest.fn(),
    removeCategory: jest.fn(),
    sheet: {
      surahName: 'البقرة',
      ayahNumber: 255,
      initialCategories: [],
      onCommit: jest.fn(),
      onDismiss: jest.fn(),
    },
    snackbar: {
      surahName: 'البقرة',
      pageNumber: 45,
      juzNumber: 3,
      resultingCategories: ['reading'],
      undone: false,
      onUndo: jest.fn(),
      onDismiss: jest.fn(),
    },
  }),
}));

jest.mock('../../data/quranRepository', () => ({
  searchAyahs: jest.fn(async () => []),
  getAyahPreview: jest.fn(async () => 'preview'),
  getMushafJuzAndPageForAyah: jest.fn(async () => ({ juz: 3, page: 45 })),
  getMushafSurahForPage: jest.fn(async () => ({ nameArabic: 'البقرة' })),
  getMushafTopAyahForPage: jest.fn(async () => ({
    surahNumber: 2,
    ayahNumber: 255,
    wordPosition: 1,
  })),
  getSurahByNumber: jest.fn(async () => ({ nameArabic: 'البقرة', nameEnglish: 'Al-Baqarah' })),
}));

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { FlashList: () => <View /> };
});

jest.mock('../quran/MushafReader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { MushafReader: () => <View testID="reader" /> };
});

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MushafScreenLayout } from '../quran/MushafScreenLayout';
import { SearchScreen } from '../search/SearchScreen';
import { BookmarksScreen } from '../bookmarks/BookmarksScreen';

const HOSTS = [
  {
    name: 'the mushaf reader',
    element: (
      <MushafScreenLayout
        loadInitialPage={async () => ({ page: 45, surahName: 'البقرة' })}
      />
    ),
  },
  { name: 'search', element: <SearchScreen /> },
  { name: 'the bookmarks list', element: <BookmarksScreen /> },
];

describe.each(HOSTS)('bookmark surfaces on $name', ({ element }) => {
  it('renders both the category sheet and the confirmation', async () => {
    const view = render(element);

    await waitFor(() => {
      expect(view.getByTestId(SHEET_ID)).toBeTruthy();
      expect(view.getByTestId(SNACKBAR_ID)).toBeTruthy();
    });
  });
});

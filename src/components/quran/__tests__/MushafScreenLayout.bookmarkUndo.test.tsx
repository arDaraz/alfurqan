import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({}),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../../../data/quranRepository', () => ({
  getMushafJuzAndPageForAyah: jest.fn(async () => ({ juz: 3, page: 42 })),
  getMushafTopAyahForPage: jest.fn(async () => ({
    surahNumber: 2,
    ayahNumber: 255,
    wordPosition: 1,
  })),
  getSurahByNumber: jest.fn(async () => ({
    number: 2,
    nameArabic: 'البقرة',
    nameEnglish: 'Al-Baqarah',
    ayahCount: 286,
    revelationType: 'Madani',
    revelationOrder: 87,
    juzStart: 1,
  })),
  getMushafSurahForPage: jest.fn(async () => null),
}));

jest.mock('../../../actions/ayahActions', () => ({
  handleAyahAction: jest.fn((action: string, selection: any, callbacks: any) => {
    if (action === 'bookmark' && callbacks?.onRequestBookmark) {
      callbacks.onRequestBookmark(selection);
    }
    return Promise.resolve();
  }),
}));

jest.mock('../../ui/LoadingSkeleton', () => ({ LoadingSkeleton: () => null }));
jest.mock('../../ui/ErrorState', () => ({ ErrorState: () => null }));
jest.mock('../ReaderHeader', () => ({ ReaderHeader: () => null }));

// MushafReader mock — expose ayah-action and page-bookmark triggers for the test.
jest.mock('../MushafReader', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return {
    MushafReader: ({
      onAyahAction,
      onPageBookmarkRequest,
    }: {
      onAyahAction?: (action: string, sel: any) => void;
      onPageBookmarkRequest?: (sel: any) => void;
    }) => (
      <>
        <Pressable
          accessibilityLabel="trigger-popup-bookmark"
          onPress={() =>
            onAyahAction?.('bookmark', {
              startSurah: 2,
              startAyah: 255,
              endSurah: 2,
              endAyah: 255,
            })
          }
        />
        <Pressable
          accessibilityLabel="trigger-page-bookmark"
          onPress={() =>
            onPageBookmarkRequest?.({
              startSurah: 2,
              startAyah: 255,
              endSurah: 2,
              endAyah: 255,
            })
          }
        />
      </>
    ),
  };
});

// Sheet mock — receives initialCategories; exposes buttons to commit specific payloads.
type Commit = {
  previous: ('reading' | 'recitation')[];
  next: ('reading' | 'recitation')[];
  added: ('reading' | 'recitation')[];
  removed: ('reading' | 'recitation')[];
};

const sheetRef: { commit: ((c: Commit) => void) | null } = { commit: null };

jest.mock('../BookmarkCategorySheet', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return {
    BookmarkCategorySheet: ({
      onCommit,
    }: {
      onCommit: (c: any) => void;
    }) => {
      sheetRef.commit = onCommit;
      return <Pressable accessibilityLabel="sheet-rendered" />;
    },
  };
});

// Snackbar mock — exposes an undo button.
const snackbarPropsRef: { props: any | null } = { props: null };

jest.mock('../BookmarkSavedSnackbar', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return {
    BookmarkSavedSnackbar: (props: any) => {
      snackbarPropsRef.props = props;
      return (
        <Pressable
          accessibilityLabel="undo-snackbar"
          onPress={() => props.onUndo()}
        />
      );
    },
  };
});

import { MushafScreenLayout } from '../MushafScreenLayout';
import { useReadingStore } from '../../../stores/readingStore';

function seed(categories: ('reading' | 'recitation')[]) {
  useReadingStore.setState({
    bookmarks: categories.map((c, i) => ({
      surahNumber: 2,
      ayahNumber: 255,
      category: c,
      createdAt: 1_700_000_000_000 + i,
    })),
  } as any);
}

async function renderLayout() {
  const result = render(
    <MushafScreenLayout
      loadInitialPage={async () => ({ page: 42, surahName: 'البقرة' })}
      errorMessage="error"
    />,
  );
  // wait for loadInitialPage to resolve
  await waitFor(() => result.getByLabelText('trigger-popup-bookmark'));
  return result;
}

async function openSheetForAyah(getByLabelText: (l: string) => any) {
  fireEvent.press(getByLabelText('trigger-popup-bookmark'));
  await waitFor(() => {
    if (!sheetRef.commit) throw new Error('sheet not opened');
  });
}

async function commitSheet(next: ('reading' | 'recitation')[], previous: ('reading' | 'recitation')[]) {
  const prevSet = new Set(previous);
  const nextSet = new Set(next);
  sheetRef.commit?.({
    previous,
    next,
    added: next.filter((c) => !prevSet.has(c)),
    removed: previous.filter((c) => !nextSet.has(c)),
  });
}

describe('MushafScreenLayout bookmark undo', () => {
  beforeEach(() => {
    sheetRef.commit = null;
    snackbarPropsRef.props = null;
    useReadingStore.setState({ bookmarks: [] } as any);
  });

  // The audit's own repro: the page was not bookmarked before the save.
  it('None → Reading: undo leaves the ayah with no bookmark at all', async () => {
    const { getByLabelText } = await renderLayout();
    fireEvent.press(getByLabelText('trigger-page-bookmark'));
    await waitFor(() => {
      if (!sheetRef.commit) throw new Error('sheet not opened');
    });
    await commitSheet(['reading'], []);
    await waitFor(() => getByLabelText('undo-snackbar'));
    fireEvent.press(getByLabelText('undo-snackbar'));
    await waitFor(() => {
      expect(
        useReadingStore
          .getState()
          .bookmarks.filter((b) => b.surahNumber === 2 && b.ayahNumber === 255)
      ).toEqual([]);
    });
  });

  it('restores the original creation time so undo keeps the list order', async () => {
    seed(['reading']);
    const original = useReadingStore.getState().bookmarks[0].createdAt;
    const { getByLabelText } = await renderLayout();
    await openSheetForAyah(getByLabelText);
    await commitSheet([], ['reading']);
    await waitFor(() => getByLabelText('undo-snackbar'));
    fireEvent.press(getByLabelText('undo-snackbar'));
    await waitFor(() => {
      const restored = useReadingStore
        .getState()
        .bookmarks.find((b) => b.surahNumber === 2 && b.ayahNumber === 255);
      expect(restored?.createdAt).toBe(original);
    });
  });

  it('Reading → Recitation: undo restores only Reading', async () => {
    seed(['reading']);
    const { getByLabelText } = await renderLayout();
    await openSheetForAyah(getByLabelText);
    await commitSheet(['recitation'], ['reading']);
    await waitFor(() => getByLabelText('undo-snackbar'));
    fireEvent.press(getByLabelText('undo-snackbar'));
    await waitFor(() => {
      const cats = useReadingStore
        .getState()
        .bookmarks.filter((b) => b.surahNumber === 2 && b.ayahNumber === 255)
        .map((b) => b.category)
        .sort();
      expect(cats).toEqual(['reading']);
    });
  });

  it('Both → Reading: undo restores Reading and Recitation', async () => {
    seed(['reading', 'recitation']);
    const { getByLabelText } = await renderLayout();
    await openSheetForAyah(getByLabelText);
    await commitSheet(['reading'], ['reading', 'recitation']);
    await waitFor(() => getByLabelText('undo-snackbar'));
    fireEvent.press(getByLabelText('undo-snackbar'));
    await waitFor(() => {
      const cats = useReadingStore
        .getState()
        .bookmarks.filter((b) => b.surahNumber === 2 && b.ayahNumber === 255)
        .map((b) => b.category)
        .sort();
      expect(cats).toEqual(['reading', 'recitation']);
    });
  });

  it('Both → Removed: undo restores Reading and Recitation', async () => {
    seed(['reading', 'recitation']);
    const { getByLabelText } = await renderLayout();
    await openSheetForAyah(getByLabelText);
    await commitSheet([], ['reading', 'recitation']);
    await waitFor(() => getByLabelText('undo-snackbar'));
    fireEvent.press(getByLabelText('undo-snackbar'));
    await waitFor(() => {
      const cats = useReadingStore
        .getState()
        .bookmarks.filter((b) => b.surahNumber === 2 && b.ayahNumber === 255)
        .map((b) => b.category)
        .sort();
      expect(cats).toEqual(['reading', 'recitation']);
    });
  });
});

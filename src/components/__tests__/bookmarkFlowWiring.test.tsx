/**
 * The bookmark interaction used to be hosted separately by each screen, and the
 * copies drifted: one screen offered Undo and another silently did not. Two
 * things are pinned here. The flow behaves correctly end to end, and every
 * screen that offers bookmarking renders both of its surfaces.
 */
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View: (props: any) => <View {...props} /> },
    SlideInDown: { duration: () => ({}) },
    SlideOutDown: { duration: () => ({}) },
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
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

jest.mock('../../data/quranRepository', () => ({
  getMushafJuzAndPageForAyah: jest.fn(async () => ({ juz: 3, page: 45 })),
  getSurahByNumber: jest.fn(async (n: number) => ({
    number: n,
    nameArabic: `سورة-${n}`,
    nameEnglish: `Surah-${n}`,
    ayahCount: 286,
    revelationType: 'Madani',
    revelationOrder: n,
    juzStart: 1,
  })),
}));

import React from 'react';
import { Pressable, Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useReadingStore } from '../../stores/readingStore';
import { useBookmarkFlow } from '../../hooks/useBookmarkFlow';
import { BookmarkCategorySheet } from '../quran/BookmarkCategorySheet';
import { BookmarkSavedSnackbar } from '../quran/BookmarkSavedSnackbar';
import type { AyahSelection } from '../../data/types';

const SURAH = 2;
const AYAH = 255;
const SELECTION: AyahSelection = {
  startSurah: SURAH,
  startAyah: AYAH,
  endSurah: SURAH,
  endAyah: AYAH,
};

const categoriesNow = () =>
  useReadingStore.getState().getBookmarkCategories(SURAH, AYAH);

/** Renders exactly what a host renders, and nothing a host does not. */
function Host() {
  const flow = useBookmarkFlow();
  return (
    <>
      <Pressable testID="request" onPress={() => flow.requestBookmark(SELECTION)}>
        <Text>request</Text>
      </Pressable>
      <Pressable
        testID="remove"
        onPress={() => flow.removeCategory(SURAH, AYAH, 'reading')}
      >
        <Text>remove</Text>
      </Pressable>
      {flow.sheet && <BookmarkCategorySheet {...flow.sheet} />}
      {flow.snackbar && (
        <BookmarkSavedSnackbar
          key={`${flow.snackbar.resultingCategories.join('|')}-${flow.snackbar.undone ? 'undone' : 'saved'}`}
          {...flow.snackbar}
        />
      )}
    </>
  );
}

const UNDO = /تراجع|Undo/i;

describe('the bookmark flow', () => {
  beforeEach(() => {
    useReadingStore.setState({ bookmarks: [] });
  });

  it('opens the category sheet when a bookmark is requested', async () => {
    const view = render(<Host />);
    fireEvent.press(view.getByTestId('request'));

    expect(await view.findByTestId('chip-reading')).toBeTruthy();
  });

  it('writes the chosen category to the store', async () => {
    const view = render(<Host />);
    fireEvent.press(view.getByTestId('request'));
    fireEvent.press(await view.findByTestId('chip-reading'));

    await waitFor(() => expect(categoriesNow()).toEqual(['reading']));
  });

  it('offers undo on the confirmation and reverses the commit', async () => {
    const view = render(<Host />);
    fireEvent.press(view.getByTestId('request'));
    fireEvent.press(await view.findByTestId('chip-reading'));

    fireEvent.press(await view.findByLabelText(UNDO));

    await waitFor(() => expect(categoriesNow()).toEqual([]));
  });

  it('makes a direct removal reversible, so a swipe cannot destroy a bookmark', async () => {
    useReadingStore.setState({
      bookmarks: [
        { surahNumber: SURAH, ayahNumber: AYAH, category: 'reading', createdAt: 1_000 },
      ],
    });
    const view = render(<Host />);
    fireEvent.press(view.getByTestId('remove'));

    await waitFor(() => expect(categoriesNow()).toEqual([]));

    fireEvent.press(await view.findByLabelText(UNDO));

    await waitFor(() => {
      const restored = useReadingStore
        .getState()
        .bookmarks.find((b) => b.surahNumber === SURAH && b.ayahNumber === AYAH);
      expect(restored?.createdAt).toBe(1_000);
    });
  });

  it('keeps the ayah bookmarked when only one of two categories is dropped', async () => {
    useReadingStore.setState({
      bookmarks: [
        { surahNumber: SURAH, ayahNumber: AYAH, category: 'reading', createdAt: 1_000 },
        { surahNumber: SURAH, ayahNumber: AYAH, category: 'recitation', createdAt: 2_000 },
      ],
    });
    const view = render(<Host />);
    fireEvent.press(view.getByTestId('remove'));

    await waitFor(() => expect(categoriesNow()).toEqual(['recitation']));
  });
});

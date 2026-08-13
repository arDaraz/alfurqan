import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (...args: any[]) => mockPush(...args), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('../../../data/quranRepository', () => ({
  getAyahPreview: jest.fn(async (s: number, a: number) => `preview-${s}-${a}`),
  getJuzAndPageForAyah: jest.fn(async () => ({ juz: 1, page: 1 })),
  getSurahByNumber: jest.fn(async (n: number) => ({
    number: n,
    nameArabic: `سورة-${n}`,
    nameEnglish: `Surah-${n}`,
    ayahCount: 7,
    revelationType: 'Makki',
    revelationOrder: n,
    juzStart: 1,
  })),
}));

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FlashList: ({ data = [], renderItem, keyExtractor }: any) => (
      <View>
        {data.map((item: any, index: number) => (
          <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
            {renderItem({ item, index })}
          </React.Fragment>
        ))}
      </View>
    ),
  };
});

jest.mock('../../home/PillTabs', () => {
  const React = require('react');
  const { View, Pressable, Text } = require('react-native');
  return {
    PillTabs: ({ tabs, active, onChange }: any) => (
      <View>
        {tabs.map((t: any) => (
          <Pressable
            key={t.id}
            accessibilityLabel={`tab-${t.id}`}
            accessibilityState={{ selected: t.id === active }}
            onPress={() => onChange(t.id)}
          >
            <Text>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    ),
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View, Pressable } = require('react-native');
  return {
    Swipeable: ({ children, renderLeftActions, renderRightActions }: any) => (
      <View>
        {children}
        {renderLeftActions ? renderLeftActions() : null}
        {renderRightActions ? renderRightActions() : null}
      </View>
    ),
    RectButton: ({ children, onPress, accessibilityLabel, style }: any) => (
      <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} style={style}>
        {children}
      </Pressable>
    ),
  };
});

import { BookmarksScreen } from '../BookmarksScreen';
import { useReadingStore } from '../../../stores/readingStore';

function seedBookmarks(items: Array<{ s: number; a: number; c: 'reading' | 'recitation' }>) {
  useReadingStore.setState({
    bookmarks: items.map((i, idx) => ({
      surahNumber: i.s,
      ayahNumber: i.a,
      category: i.c,
      createdAt: 1_700_000_000_000 + idx,
    })),
  } as any);
}

describe('BookmarksScreen', () => {
  beforeEach(() => {
    mockPush.mockReset();
    useReadingStore.setState({ bookmarks: [] } as any);
  });

  it('shows empty state when no bookmarks exist for the active tab', async () => {
    const { getByText } = render(<BookmarksScreen />);
    expect(getByText('لم تحفظ آيات للحفظ بعد')).toBeTruthy();
  });

  it('renders bookmarks for the recitation tab by default and ignores reading entries', async () => {
    seedBookmarks([
      { s: 2, a: 255, c: 'reading' },
      { s: 36, a: 1, c: 'recitation' },
    ]);
    const { findByText, queryByText } = render(<BookmarksScreen />);
    expect(await findByText(/سورة-36/)).toBeTruthy();
    expect(queryByText(/سورة-2/)).toBeNull();
  });

  it('switches to the reading tab and renders its entries', async () => {
    seedBookmarks([
      { s: 2, a: 255, c: 'reading' },
      { s: 36, a: 1, c: 'recitation' },
    ]);
    const { getByLabelText, findByText } = render(<BookmarksScreen />);
    fireEvent.press(getByLabelText('tab-reading'));
    expect(await findByText(/سورة-2/)).toBeTruthy();
  });

  it('navigates to /surah/[id]?page=N when a row is pressed', async () => {
    seedBookmarks([{ s: 2, a: 255, c: 'recitation' }]);
    const { findByLabelText } = render(<BookmarksScreen />);
    const row = await findByLabelText('bookmark-row-2-255');
    fireEvent.press(row);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/surah/[id]' })
      );
    });
  });

  it('swipe-delete removes only the current-tab category', async () => {
    seedBookmarks([
      { s: 2, a: 255, c: 'reading' },
      { s: 2, a: 255, c: 'recitation' },
    ]);
    const { findByLabelText } = render(<BookmarksScreen />);
    await findByLabelText('bookmark-row-2-255');
    fireEvent.press(await findByLabelText('delete-2-255'));
    await waitFor(() => {
      const bms = useReadingStore.getState().bookmarks;
      expect(bms).toHaveLength(1);
      expect(bms[0].category).toBe('reading');
    });
  });
});

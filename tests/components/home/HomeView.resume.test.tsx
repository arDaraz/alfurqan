jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

const mockPush = jest.fn();
const mockGetMushafPageForAyah = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    FlashList: ({ data = [], renderItem, ListEmptyComponent }: {
      data?: unknown[];
      renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
      ListEmptyComponent?: React.ReactNode;
    }) => (
      <View>
        {data.map((item, index) => (
          <React.Fragment key={index}>{renderItem({ item, index })}</React.Fragment>
        ))}
        {ListEmptyComponent}
      </View>
    ),
  };
});

jest.mock('../../../src/hooks/useSurahList', () => ({
  useSurahList: jest.fn(),
}));

jest.mock('../../../src/hooks/useJuzList', () => ({
  useJuzList: jest.fn(),
}));

jest.mock('../../../src/hooks/useSearch', () => ({
  useSearch: jest.fn(),
}));

jest.mock('../../../src/data/quranRepository', () => ({
  getMushafPageForAyah: (...args: unknown[]) => mockGetMushafPageForAyah(...args),
}));

const mockReadingState = {
  lastReadSurah: 2,
  lastReadAyah: 255,
  lastReadJuz: 3,
  lastReadPage: 45,
  lastReadPageByLayout: { 'madani-qcf-v2-hafs': 45 } as Record<string, number>,
  lastReadAt: new Date('2026-04-29T10:00:00Z').getTime(),
  streakDays: 4,
  streakLastReadDate: '2026-04-29',
};

jest.mock('../../../src/stores/readingStore', () => ({
  useReadingStore: (selector: (state: typeof mockReadingState) => unknown) =>
    selector(mockReadingState),
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HomeView } from '../../../src/components/home/HomeView';
import { useJuzList } from '../../../src/hooks/useJuzList';
import { useSearch } from '../../../src/hooks/useSearch';
import { useSurahList } from '../../../src/hooks/useSurahList';
import { useSettingsStore } from '../../../src/stores/settingsStore';

const surahs = [
  {
    number: 2,
    nameArabic: 'البقرة',
    nameEnglish: 'Al-Baqarah',
    ayahCount: 286,
    revelationType: 'Madani' as const,
    revelationOrder: 87,
    juzStart: 1,
  },
];

describe('HomeView resume route', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGetMushafPageForAyah.mockReset();
    mockGetMushafPageForAyah.mockResolvedValue(42);
    jest.mocked(useSurahList).mockReturnValue({
      surahs,
      loading: false,
      error: null,
      retry: jest.fn(),
    });
    jest.mocked(useJuzList).mockReturnValue({
      juzList: [],
      loading: false,
      error: null,
      retry: jest.fn(),
    });
    jest.mocked(useSearch).mockReturnValue({
      query: '',
      setQuery: jest.fn(),
      filtered: surahs,
    });
    useSettingsStore.setState({ language: 'ar', themeMode: 'light' });
  });

  it('passes the canonical ayah when resuming from the greeting card', () => {
    const { getByLabelText } = render(<HomeView />);

    fireEvent.press(getByLabelText('استأنف'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/surah/[id]',
      params: { id: '2', ayah: '255' },
    });
  });

  it('recomputes a stale layout page cache from the canonical ayah', async () => {
    mockReadingState.lastReadPageByLayout = {
      'madani-qcf-v2-hafs': 45,
      'indopak-15-line-hafs': 44,
    };
    useSettingsStore.setState({
      language: 'en',
      mushafLayoutId: 'indopak-15-line-hafs',
    });

    const { findByText } = render(<HomeView />);

    expect(await findByText('Juz 3 · Page 42')).toBeTruthy();
    expect(mockGetMushafPageForAyah).toHaveBeenCalledWith(
      'indopak-15-line-hafs',
      2,
      255
    );
  });
});

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
const mockGetSurahByNumber = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-location', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
  Accuracy: { Low: 1 },
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getLastKnownPositionAsync: jest.fn().mockResolvedValue(null),
  getCurrentPositionAsync: jest.fn().mockResolvedValue(null),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([]),
  watchHeadingAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
}));

jest.mock('../../../src/data/quranRepository', () => ({
  getMushafPageForAyah: (...args: unknown[]) => mockGetMushafPageForAyah(...args),
  getSurahByNumber: (...args: unknown[]) => mockGetSurahByNumber(...args),
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
  longestStreak: 9,
};

jest.mock('../../../src/stores/readingStore', () => ({
  useReadingStore: (selector: (state: typeof mockReadingState) => unknown) =>
    selector(mockReadingState),
  weekActivity: () => [false, false, false, true, true, true, true],
}));

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { HomeView } from '../../../src/components/home/HomeView';
import { useSettingsStore } from '../../../src/stores/settingsStore';

describe('HomeView resume route', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGetMushafPageForAyah.mockReset();
    mockGetMushafPageForAyah.mockResolvedValue(42);
    mockGetSurahByNumber.mockReset();
    mockGetSurahByNumber.mockResolvedValue({
      number: 2,
      nameArabic: 'البقرة',
      nameEnglish: 'Al-Baqarah',
      ayahCount: 286,
      revelationType: 'Madani',
      revelationOrder: 87,
      juzStart: 1,
    });
    useSettingsStore.setState({
      language: 'ar',
      themeMode: 'light',
      mushafLayoutId: 'madani-qcf-v2-hafs',
    });
  });

  it('passes the canonical ayah when resuming from the continue-reading widget', async () => {
    const { getByLabelText } = render(<HomeView />);

    await waitFor(() => getByLabelText('استأنف'));
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
    expect(mockGetMushafPageForAyah).toHaveBeenCalledWith('indopak-15-line-hafs', 2, 255);
  });

  it('hides a widget the reader turned off in settings', async () => {
    useSettingsStore.setState({
      homeWidgets: {
        prayerTimes: false,
        qiblah: false,
        continueReading: true,
        streak: false,
        khatam: false,
        tasmee: false,
      },
    });

    const { findByLabelText, queryByText } = render(<HomeView />);

    await findByLabelText('استأنف');
    expect(queryByText('الختمة')).toBeNull();
    expect(queryByText('المواصلة')).toBeNull();
  });
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  getMushafPageForAyah,
  getMushafPageForSurah,
  getMushafTopAyahForPage,
  getSurahByNumber,
} from '../../../data/quranRepository';

import SurahScreen from '../[id]';

let mockCapturedLoadInitialPage: (() => Promise<{
  page: number;
  surahName: string;
  location?: { surahNumber: number; ayahNumber: number; wordPosition?: number };
}>) | null = null;

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../../data/quranRepository', () => ({
  getSurahByNumber: jest.fn(),
  getMushafPageForSurah: jest.fn(),
  getMushafPageForAyah: jest.fn(),
  getMushafTopAyahForPage: jest.fn(),
}));

jest.mock('../../../components/quran/MushafScreenLayout', () => ({
  MushafScreenLayout: ({
    loadInitialPage,
  }: {
    loadInitialPage: () => Promise<{
      page: number;
      surahName: string;
      location?: { surahNumber: number; ayahNumber: number; wordPosition?: number };
    }>;
  }) => {
    mockCapturedLoadInitialPage = loadInitialPage;
    return null;
  },
}));

const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockGetSurahByNumber = jest.mocked(getSurahByNumber);
const mockGetPageForSurah = jest.mocked(getMushafPageForSurah);
const mockGetPageForAyah = jest.mocked(getMushafPageForAyah);
const mockGetTopAyahForPage = jest.mocked(getMushafTopAyahForPage);

describe('SurahScreen resume page', () => {
  beforeEach(() => {
    mockCapturedLoadInitialPage = null;
    mockUseLocalSearchParams.mockReturnValue({ id: '2', page: '45' });
    mockGetSurahByNumber.mockResolvedValue({
      number: 2,
      nameArabic: 'البقرة',
      nameEnglish: 'Al-Baqarah',
      ayahCount: 286,
      revelationType: 'Madani',
      revelationOrder: 87,
      juzStart: 1,
    });
    mockGetPageForSurah.mockResolvedValue(2);
    mockGetPageForAyah.mockResolvedValue(609);
    mockGetTopAyahForPage.mockResolvedValue({
      surahNumber: 2,
      ayahNumber: 1,
      wordPosition: 1,
    });
  });

  it('starts on the supplied resume page instead of the beginning of the surah', async () => {
    render(<SurahScreen />);

    await expect(mockCapturedLoadInitialPage?.()).resolves.toEqual({
      page: 45,
      surahName: 'البقرة',
      location: { surahNumber: 2, ayahNumber: 1, wordPosition: 1 },
    });
    expect(mockGetPageForSurah).not.toHaveBeenCalled();
  });

  it('falls back to the first surah page when no valid resume page is supplied', async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: '2', page: 'not-a-page' });

    render(<SurahScreen />);

    await expect(mockCapturedLoadInitialPage?.()).resolves.toEqual({
      page: 2,
      surahName: 'البقرة',
      location: { surahNumber: 2, ayahNumber: 1 },
    });
    expect(mockGetPageForSurah).toHaveBeenCalledWith('madani-qcf-v2-hafs', 2);
  });

  it('carries the exact route ayah as the canonical initial location', async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: '112', ayah: '1' });

    render(<SurahScreen />);

    await expect(mockCapturedLoadInitialPage?.()).resolves.toEqual({
      page: 609,
      surahName: 'البقرة',
      location: { surahNumber: 112, ayahNumber: 1 },
    });
    expect(mockGetPageForAyah).toHaveBeenCalledWith('madani-qcf-v2-hafs', 112, 1);
  });
});

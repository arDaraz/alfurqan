import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPageForSurah, getSurahByNumber } from '../../../data/quranRepository';

import SurahScreen from '../[id]';

let mockCapturedLoadInitialPage: (() => Promise<{ page: number; surahName: string }>) | null = null;

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../../data/quranRepository', () => ({
  getSurahByNumber: jest.fn(),
  getPageForSurah: jest.fn(),
}));

jest.mock('../../../components/quran/MushafScreenLayout', () => ({
  MushafScreenLayout: ({
    loadInitialPage,
  }: {
    loadInitialPage: () => Promise<{ page: number; surahName: string }>;
  }) => {
    mockCapturedLoadInitialPage = loadInitialPage;
    return null;
  },
}));

const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockGetSurahByNumber = jest.mocked(getSurahByNumber);
const mockGetPageForSurah = jest.mocked(getPageForSurah);

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
  });

  it('starts on the supplied resume page instead of the beginning of the surah', async () => {
    render(<SurahScreen />);

    await expect(mockCapturedLoadInitialPage?.()).resolves.toEqual({
      page: 45,
      surahName: 'البقرة',
    });
    expect(mockGetPageForSurah).not.toHaveBeenCalled();
  });

  it('falls back to the first surah page when no valid resume page is supplied', async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: '2', page: 'not-a-page' });

    render(<SurahScreen />);

    await expect(mockCapturedLoadInitialPage?.()).resolves.toEqual({
      page: 2,
      surahName: 'البقرة',
    });
    expect(mockGetPageForSurah).toHaveBeenCalledWith(2);
  });
});

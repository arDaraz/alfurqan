import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { getSurahByNumber, getPageForSurah } from '../../data/quranRepository';
import { MushafScreenLayout } from '../../components/quran/MushafScreenLayout';

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahNumber = parseInt(id || '1', 10);

  const loadInitialPage = useCallback(async () => {
    const [surah, page] = await Promise.all([
      getSurahByNumber(surahNumber),
      getPageForSurah(surahNumber),
    ]);
    return { page, surahName: surah?.nameArabic ?? '' };
  }, [surahNumber]);

  return <MushafScreenLayout loadInitialPage={loadInitialPage} errorMessage="Failed to load surah" />;
}

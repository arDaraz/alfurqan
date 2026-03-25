import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { getPageForJuz, getSurahForPage } from '../../data/quranRepository';
import { MushafScreenLayout } from '../../components/quran/MushafScreenLayout';

export default function JuzScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const juzNumber = parseInt(id || '1', 10);

  const loadInitialPage = useCallback(async () => {
    const page = await getPageForJuz(juzNumber);
    const surah = await getSurahForPage(page);
    return { page, surahName: surah?.nameArabic ?? '' };
  }, [juzNumber]);

  return <MushafScreenLayout loadInitialPage={loadInitialPage} errorMessage="Failed to load juz" />;
}

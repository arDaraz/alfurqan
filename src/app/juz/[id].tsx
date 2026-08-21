import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  getMushafPageForJuz,
  getMushafSurahForPage,
  getMushafTopAyahForPage,
} from '../../data/quranRepository';
import { MushafScreenLayout } from '../../components/quran/MushafScreenLayout';
import { useSettingsStore } from '../../stores/settingsStore';

export default function JuzScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const juzNumber = parseInt(id || '1', 10);
  const layoutId = useSettingsStore((state) => state.mushafLayoutId);

  const loadInitialPage = useCallback(async () => {
    const page = await getMushafPageForJuz(layoutId, juzNumber);
    const [surah, location] = await Promise.all([
      getMushafSurahForPage(layoutId, page),
      getMushafTopAyahForPage(layoutId, page),
    ]);
    return { page, surahName: surah?.nameArabic ?? '', location };
  }, [juzNumber, layoutId]);

  return <MushafScreenLayout loadInitialPage={loadInitialPage} />;
}

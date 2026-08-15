import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  getMushafPageForAyah,
  getMushafPageForSurah,
  getMushafTopAyahForPage,
  getSurahByNumber,
} from '../../data/quranRepository';
import { MushafScreenLayout } from '../../components/quran/MushafScreenLayout';
import { DEFAULT_MUSHAF_LAYOUT_ID, getMushafLayout, isMushafLayoutId } from '../../data/mushafLayouts';
import { useSettingsStore } from '../../stores/settingsStore';

function firstParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveIntegerParam(value: string | string[] | undefined): number | null {
  const raw = firstParamValue(value);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function SurahScreen() {
  const { id, ayah, page, layout: routeLayout } = useLocalSearchParams<{
    id?: string | string[];
    ayah?: string | string[];
    page?: string | string[];
    layout?: string | string[];
  }>();
  const layoutId = useSettingsStore((state) => state.mushafLayoutId);
  const surahNumber = parsePositiveIntegerParam(id) ?? 1;
  const ayahNumber = parsePositiveIntegerParam(ayah);
  const requestedPage = parsePositiveIntegerParam(page);
  const rawRouteLayout = firstParamValue(routeLayout);
  const pageLayoutId = isMushafLayoutId(rawRouteLayout) ? rawRouteLayout : DEFAULT_MUSHAF_LAYOUT_ID;

  const loadInitialPage = useCallback(async () => {
    const surah = await getSurahByNumber(surahNumber);
    let initialPage: number;
    let location: { surahNumber: number; ayahNumber: number; wordPosition?: number };
    if (ayahNumber) {
      initialPage = await getMushafPageForAyah(layoutId, surahNumber, ayahNumber);
      location = { surahNumber, ayahNumber };
    } else if (requestedPage && requestedPage <= getMushafLayout(pageLayoutId).pageCount) {
      const canonical = await getMushafTopAyahForPage(pageLayoutId, requestedPage);
      if (pageLayoutId === layoutId) {
        initialPage = requestedPage;
      } else {
        initialPage = await getMushafPageForAyah(layoutId, canonical.surahNumber, canonical.ayahNumber);
      }
      location = canonical;
    } else {
      initialPage = await getMushafPageForSurah(layoutId, surahNumber);
      location = { surahNumber, ayahNumber: 1 };
    }

    return { page: initialPage, surahName: surah?.nameArabic ?? '', location };
  }, [ayahNumber, layoutId, pageLayoutId, requestedPage, surahNumber]);

  return <MushafScreenLayout loadInitialPage={loadInitialPage} errorMessage="Failed to load surah" />;
}

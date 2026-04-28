import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { getSurahByNumber, getPageForSurah } from '../../data/quranRepository';
import { MushafScreenLayout } from '../../components/quran/MushafScreenLayout';

const FIRST_MUSHAF_PAGE = 1;
const LAST_MUSHAF_PAGE = 604;

function firstParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveIntegerParam(value: string | string[] | undefined): number | null {
  const raw = firstParamValue(value);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseMushafPageParam(value: string | string[] | undefined): number | null {
  const parsed = parsePositiveIntegerParam(value);
  if (parsed === null) return null;
  return parsed >= FIRST_MUSHAF_PAGE && parsed <= LAST_MUSHAF_PAGE ? parsed : null;
}

export default function SurahScreen() {
  const { id, page } = useLocalSearchParams<{ id?: string | string[]; page?: string | string[] }>();
  const surahNumber = parsePositiveIntegerParam(id) ?? 1;
  const resumePage = parseMushafPageParam(page);

  const loadInitialPage = useCallback(async () => {
    const surah = await getSurahByNumber(surahNumber);
    const initialPage = resumePage ?? await getPageForSurah(surahNumber);

    return { page: initialPage, surahName: surah?.nameArabic ?? '' };
  }, [surahNumber, resumePage]);

  return <MushafScreenLayout loadInitialPage={loadInitialPage} errorMessage="Failed to load surah" />;
}

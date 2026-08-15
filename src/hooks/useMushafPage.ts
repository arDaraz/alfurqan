import { useState, useEffect, useCallback, useRef } from 'react';
import {
  assertMushafLayoutAvailable,
  getLayoutLinesByPage,
  getLayoutWordsByPage,
  getMushafLayoutFont,
  getPageMarkers,
  getSemanticAyahsForMushafPage,
  getSurahs,
  MushafContentPackError,
} from '../data/quranRepository';
import {
  DEFAULT_MUSHAF_LAYOUT_ID,
  getMushafLayout,
  type MushafLayoutId,
} from '../data/mushafLayouts';
import { generateMushafHtml, type BismillahData } from '../components/quran/mushafHtml';
import { generateLayoutMushafHtml } from '../components/quran/mushafHtmlLayout';
import { SURAH_AL_FATIHA, surahHasBismillah } from '../constants/quran';
import type { NightReadingMode } from '../constants/nightReading';
import type { AppLanguage } from '../utils/locale';
import { toArabicIndic } from '../utils/arabic';
import { useSettingsStore } from '../stores/settingsStore';

const MAX_CACHE_SIZE = 12;
const DEFAULT_QURAN_FONT_SCALE = 0.58;
const MIN_PREVIEW_FONT_SIZE = 18;
const PREVIEW_FONT_SIZE_RANGE = 18;
const htmlCache = new Map<string, { html: string; accessibilityLabel: string }>();
let madaniBismillahPromise: Promise<BismillahData | null> | null = null;

function cacheHtml(
  cacheKey: string,
  value: { html: string; accessibilityLabel: string }
): void {
  if (htmlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = htmlCache.keys().next().value;
    if (firstKey !== undefined) htmlCache.delete(firstKey);
  }
  htmlCache.set(cacheKey, value);
}

export function quranFontScaleToHtmlScale(quranFontScale: number): number {
  const clampedScale = Math.max(0, Math.min(1, quranFontScale));
  const defaultPreviewSize =
    MIN_PREVIEW_FONT_SIZE + DEFAULT_QURAN_FONT_SCALE * PREVIEW_FONT_SIZE_RANGE;
  const previewSize = MIN_PREVIEW_FONT_SIZE + clampedScale * PREVIEW_FONT_SIZE_RANGE;
  return previewSize / defaultPreviewSize;
}

export function buildMushafHtmlCacheKey(
  layoutId: MushafLayoutId,
  pageNumber: number,
  quranFontScale: number,
  nightReadingMode: NightReadingMode = 'off',
  language: AppLanguage = 'ar'
): string {
  return `${layoutId}:${pageNumber}:${quranFontScaleToHtmlScale(quranFontScale).toFixed(4)}:${nightReadingMode}:${language}`;
}

async function getMadaniBismillahData(): Promise<BismillahData | null> {
  if (!madaniBismillahPromise) {
    madaniBismillahPromise = Promise.all([
      getLayoutWordsByPage(DEFAULT_MUSHAF_LAYOUT_ID, 1),
      getMushafLayoutFont(DEFAULT_MUSHAF_LAYOUT_ID, 1),
    ]).then(([words, fontBase64]) => {
      const bismillahWords = words.filter(
        (word) =>
          word.surahNumber === SURAH_AL_FATIHA &&
          word.ayahNumber === 1 &&
          word.charType === 'word'
      );
      return bismillahWords.length > 0
        ? { codes: bismillahWords.map((word) => word.codeV2).join(' '), fontBase64 }
        : null;
    });
  }
  return madaniBismillahPromise;
}

export function useMushafPage(pageNumber: number, requestedLayoutId?: MushafLayoutId) {
  const selectedLayoutId = useSettingsStore((state) => state.mushafLayoutId);
  const layoutId = requestedLayoutId ?? selectedLayoutId;
  const quranFontScale = useSettingsStore((state) => state.quranFontScale);
  const nightReadingMode = useSettingsStore((state) => state.nightReadingMode);
  const language = useSettingsStore((state) => state.language);
  const [html, setHtml] = useState<string | null>(null);
  const [accessibilityLabel, setAccessibilityLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadPage = useCallback(async () => {
    const cacheKey = buildMushafHtmlCacheKey(
      layoutId,
      pageNumber,
      quranFontScale,
      nightReadingMode,
      language
    );
    const cached = htmlCache.get(cacheKey);
    if (cached) {
      setHtml(cached.html);
      setAccessibilityLabel(cached.accessibilityLabel);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setHtml(null);
    try {
      await assertMushafLayoutAvailable(layoutId);
      const layout = getMushafLayout(layoutId);
      const [words, lines, fontBase64, surahs, semanticAyahs, markers] = await Promise.all([
        getLayoutWordsByPage(layoutId, pageNumber),
        getLayoutLinesByPage(layoutId, pageNumber),
        getMushafLayoutFont(layoutId, pageNumber),
        getSurahs(),
        getSemanticAyahsForMushafPage(layoutId, pageNumber),
        layoutId === DEFAULT_MUSHAF_LAYOUT_ID ? getPageMarkers(pageNumber) : Promise.resolve([]),
      ]);
      if (!mountedRef.current) return;

      const surahNames = Object.fromEntries(surahs.map((surah) => [surah.number, surah.nameArabic]));
      const accessibleSurahNames = Object.fromEntries(
        surahs.map((surah) => [
          surah.number,
          language === 'ar' ? surah.nameArabic : surah.nameEnglish,
        ])
      );
      const readerFontSizeScale = quranFontScaleToHtmlScale(quranFontScale);
      let generatedHtml: string;

      if (layout.rendererKind === 'unicode-authoritative-lines') {
        generatedHtml = generateLayoutMushafHtml({
          layout,
          pageNumber,
          lines,
          fontBase64,
          surahNames,
          fontSizeScale: readerFontSizeScale,
          nightReadingMode,
        });
      } else {
        const surahStart = words.find(
          (word) => word.ayahNumber === 1 && word.wordPosition === 1
        )?.surahNumber;
        const needsBismillah = words.some(
          (word) =>
            word.ayahNumber === 1 &&
            word.wordPosition === 1 &&
            surahHasBismillah(word.surahNumber)
        );
        generatedHtml = generateMushafHtml({
          pageNumber,
          words,
          fontBase64,
          fontSizeScale: readerFontSizeScale,
          surahNumber: surahStart,
          bismillah: needsBismillah ? (await getMadaniBismillahData()) ?? undefined : undefined,
          markers,
          nightReadingMode,
          surahNames,
        });
      }

      const semanticText = semanticAyahs
        .map((ayah) => {
          const ayahNumber = language === 'ar' ? toArabicIndic(ayah.ayahNumber) : ayah.ayahNumber;
          return `${accessibleSurahNames[ayah.surahNumber] ?? ayah.surahNumber} ${ayahNumber}. ${ayah.textUthmani}`;
        })
        .join(' ');
      const nextAccessibilityLabel = language === 'ar'
        ? `${layout.displayName.ar}، الصفحة ${toArabicIndic(pageNumber)} من ${toArabicIndic(layout.pageCount)}. ${semanticText}`
        : `${layout.displayName.en}, page ${pageNumber} of ${layout.pageCount}. ${semanticText}`;
      cacheHtml(cacheKey, { html: generatedHtml, accessibilityLabel: nextAccessibilityLabel });
      setHtml(generatedHtml);
      setAccessibilityLabel(nextAccessibilityLabel);
    } catch (caught) {
      if (!mountedRef.current) return;
      if (caught instanceof MushafContentPackError) {
        setError(caught.code === 'out_of_range' ? 'page_load_error' : 'content_pack_error');
      } else {
        const message = caught instanceof Error ? caught.message.toLowerCase() : '';
        setError(message.includes('font') ? 'font_load_error' : 'page_load_error');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [language, layoutId, nightReadingMode, pageNumber, quranFontScale]);

  useEffect(() => {
    mountedRef.current = true;
    void loadPage();
    return () => {
      mountedRef.current = false;
    };
  }, [loadPage]);

  return { html, accessibilityLabel, loading, error, retry: loadPage };
}

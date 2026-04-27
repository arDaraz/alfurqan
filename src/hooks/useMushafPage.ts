import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getWordsByPage,
  getQcfFont,
  getPageMarkers,
  getQcfV1WordsByPage,
  getQcfV1Font,
  getQcfV4Font,
  getIndopakWordsByPage,
  getUthmaniWordsByPage,
  getIndopakNastaleeqFont,
  getDigitalKhattIndopakFont,
} from '../data/quranRepository';
import { generateMushafHtml } from '../components/quran/mushafHtml';
import { generateUnicodeMushafHtml, type UnicodeMushafHtmlOptions } from '../components/quran/mushafHtmlUnicode';
import type { BismillahData } from '../components/quran/mushafHtml';
import { SURAH_AL_FATIHA, surahHasBismillah } from '../constants/quran';
import type { NightReadingMode } from '../constants/nightReading';
import { useSettingsStore } from '../stores/settingsStore';
import type { MushafFont } from '../stores/settingsStore';

const MAX_CACHE_SIZE = 10;
const DEFAULT_QURAN_FONT_SCALE = 0.58;
const MIN_PREVIEW_FONT_SIZE = 18;
const PREVIEW_FONT_SIZE_RANGE = 18;

// Module-level LRU cache shared across all hook instances
const htmlCache = new Map<string, string>();

// Cached Bismillah data (page 1 font + codes) — loaded once
const bismillahCache = new Map<MushafFont, BismillahData>();

function cacheHtml(cacheKey: string, html: string): void {
  if (htmlCache.size >= MAX_CACHE_SIZE) {
    // Delete oldest entry (first key)
    const firstKey = htmlCache.keys().next().value;
    if (firstKey !== undefined) htmlCache.delete(firstKey);
  }
  htmlCache.set(cacheKey, html);
}

const bismillahPromises = new Map<MushafFont, Promise<BismillahData | null>>();

export function quranFontScaleToHtmlScale(quranFontScale: number): number {
  const clampedScale = Math.max(0, Math.min(1, quranFontScale));
  const defaultPreviewSize =
    MIN_PREVIEW_FONT_SIZE + DEFAULT_QURAN_FONT_SCALE * PREVIEW_FONT_SIZE_RANGE;
  const previewSize =
    MIN_PREVIEW_FONT_SIZE + clampedScale * PREVIEW_FONT_SIZE_RANGE;

  return previewSize / defaultPreviewSize;
}

export function buildMushafHtmlCacheKey(
  mushafFont: MushafFont,
  pageNumber: number,
  quranFontScale: number,
  nightReadingMode: NightReadingMode = 'off'
): string {
  return `${mushafFont}:${pageNumber}:${quranFontScaleToHtmlScale(quranFontScale).toFixed(4)}:${nightReadingMode}`;
}

function getWordsLoader(mushafFont: MushafFont) {
  if (mushafFont === 'digital-khatt-indopak') return getUthmaniWordsByPage;
  if (mushafFont === 'indopak-nastaleeq') return getIndopakWordsByPage;
  return mushafFont === 'qcf-v1' ? getQcfV1WordsByPage : getWordsByPage;
}

function getFontLoader(mushafFont: MushafFont) {
  if (mushafFont === 'qcf-v1') return getQcfV1Font;
  if (mushafFont === 'qcf-v4') return getQcfV4Font;
  if (mushafFont === 'indopak-nastaleeq') return getIndopakNastaleeqFont;
  if (mushafFont === 'digital-khatt-indopak') return getDigitalKhattIndopakFont;
  return getQcfFont;
}

function getUnicodeFontOptions(
  mushafFont: MushafFont
): Pick<
  UnicodeMushafHtmlOptions,
  | 'fontFamily'
  | 'fontFormat'
  | 'fontMimeType'
  | 'fontFeatureSettings'
  | 'fontSizeScale'
  | 'maxFontSizePx'
  | 'compactTopPaddingVh'
  | 'compactLineMinHeightVh'
  | 'minimumLineScale'
  | 'lineFitWidthRatio'
> | null {
  if (mushafFont === 'indopak-nastaleeq') {
    return {
      fontFamily: 'IndopakNastaleeq',
      fontFormat: 'woff2',
      fontMimeType: 'font/woff2',
      fontFeatureSettings: '"liga" 1, "calt" 1, "rlig" 1',
    };
  }

  if (mushafFont === 'digital-khatt-indopak') {
    return {
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
      fontFeatureSettings: '"liga" 1, "calt" 1, "rlig" 1',
      fontSizeScale: 0.9,
      maxFontSizePx: 32,
      compactTopPaddingVh: 8,
      compactLineMinHeightVh: 7,
      minimumLineScale: 0.9,
      lineFitWidthRatio: 0.9,
    };
  }

  return null;
}

async function getBismillahData(mushafFont: MushafFont): Promise<BismillahData | null> {
  const cached = bismillahCache.get(mushafFont);
  if (cached) return cached;

  let promise = bismillahPromises.get(mushafFont);
  if (!promise) {
    promise = (async () => {
      const getWords = getWordsLoader(mushafFont);
      const getFont = getFontLoader(mushafFont);
      const [page1Words, page1Font] = await Promise.all([
        getWords(1),
        getFont(1),
      ]);
      if (!page1Font) return null;
      const bsmWords = page1Words.filter(
        (w) => w.surahNumber === SURAH_AL_FATIHA && w.ayahNumber === 1 && w.charType === 'word'
      );
      if (bsmWords.length === 0) return null;
      const data = {
        codes: bsmWords.map((w) => w.codeV2).join(' '),
        fontBase64: page1Font,
      };
      bismillahCache.set(mushafFont, data);
      return data;
    })().then((result) => {
      if (!result) bismillahPromises.delete(mushafFont); // allow retry on transient failure
      return result;
    });
    bismillahPromises.set(mushafFont, promise);
  }
  return promise;
}

export function useMushafPage(pageNumber: number) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const mushafFont = useSettingsStore((s) => s.mushafFont);
  const quranFontScale = useSettingsStore((s) => s.quranFontScale);
  const nightReadingMode = useSettingsStore((s) => s.nightReadingMode);

  const loadPage = useCallback(async () => {
    const readerFontSizeScale = quranFontScaleToHtmlScale(quranFontScale);
    const cacheKey = buildMushafHtmlCacheKey(
      mushafFont,
      pageNumber,
      quranFontScale,
      nightReadingMode
    );
    const cached = htmlCache.get(cacheKey);
    if (cached) {
      setHtml(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const getWords = getWordsLoader(mushafFont);
      const getFont = getFontLoader(mushafFont);
      const [words, fontBase64, markers] = await Promise.all([
        getWords(pageNumber),
        getFont(pageNumber),
        getPageMarkers(pageNumber),
      ]);

      if (!mountedRef.current) return;
      if (!fontBase64) { setError('font_load_error'); setLoading(false); return; }
      if (words.length === 0) { setError('page_load_error'); setLoading(false); return; }

      let surahNumber: number | undefined;
      let needsBismillah = false;
      for (const w of words) {
        if (w.ayahNumber === 1) {
          if (!surahNumber) surahNumber = w.surahNumber;
          if (w.wordPosition === 1 && surahHasBismillah(w.surahNumber)) {
            needsBismillah = true;
          }
        }
      }

      const unicodeFontOptions = getUnicodeFontOptions(mushafFont);
      const bismillahData = needsBismillah ? (await getBismillahData(mushafFont)) ?? undefined : undefined;
      if (!mountedRef.current) return;

      const unicodeFontSizeScale =
        (unicodeFontOptions?.fontSizeScale ?? 1) * readerFontSizeScale;
      const generatedHtml = unicodeFontOptions
        ? generateUnicodeMushafHtml({
            pageNumber,
            words,
            fontBase64,
            surahNumber,
            bismillahText: bismillahData?.codes,
            ...unicodeFontOptions,
            fontSizeScale: unicodeFontSizeScale,
            nightReadingMode,
          })
        : generateMushafHtml({
            pageNumber,
            words,
            fontBase64,
            fontSizeScale: readerFontSizeScale,
            surahNumber,
            bismillah: bismillahData,
            markers,
            nightReadingMode,
          });
      cacheHtml(cacheKey, generatedHtml);
      setHtml(generatedHtml);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error && err.message.toLowerCase().includes('font') ? 'font_load_error' : 'page_load_error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [pageNumber, mushafFont, quranFontScale, nightReadingMode]);

  useEffect(() => {
    mountedRef.current = true;
    loadPage();
    return () => { mountedRef.current = false; };
  }, [loadPage]);

  return { html, loading, error, retry: loadPage };
}

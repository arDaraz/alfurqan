import { useState, useEffect, useCallback, useRef } from 'react';
import { getWordsByPage, getQcfFont, getPageMarkers } from '../data/quranRepository';
import { generateMushafHtml } from '../components/quran/mushafHtml';
import type { BismillahData } from '../components/quran/mushafHtml';
import { SURAH_AL_FATIHA, surahHasBismillah } from '../constants/quran';

const MAX_CACHE_SIZE = 10;

// Module-level LRU cache shared across all hook instances
const htmlCache = new Map<number, string>();

// Cached Bismillah data (page 1 font + codes) — loaded once
let bismillahCache: BismillahData | null = null;

function cacheHtml(pageNumber: number, html: string): void {
  if (htmlCache.size >= MAX_CACHE_SIZE) {
    // Delete oldest entry (first key)
    const firstKey = htmlCache.keys().next().value;
    if (firstKey !== undefined) htmlCache.delete(firstKey);
  }
  htmlCache.set(pageNumber, html);
}

let bismillahPromise: Promise<BismillahData | null> | null = null;

async function getBismillahData(): Promise<BismillahData | null> {
  if (bismillahCache) return bismillahCache;
  if (!bismillahPromise) {
    bismillahPromise = (async () => {
      const [page1Words, page1Font] = await Promise.all([
        getWordsByPage(1),
        getQcfFont(1),
      ]);
      if (!page1Font) return null;
      const bsmWords = page1Words.filter(
        (w) => w.surahNumber === SURAH_AL_FATIHA && w.ayahNumber === 1 && w.charType === 'word'
      );
      if (bsmWords.length === 0) return null;
      bismillahCache = {
        codes: bsmWords.map((w) => w.codeV2).join(' '),
        fontBase64: page1Font,
      };
      return bismillahCache;
    })().then((result) => {
      if (!result) bismillahPromise = null; // allow retry on transient failure
      return result;
    });
  }
  return bismillahPromise;
}

export function useMushafPage(pageNumber: number) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadPage = useCallback(async () => {
    // Check cache first
    const cached = htmlCache.get(pageNumber);
    if (cached) {
      setHtml(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [words, fontBase64, markers] = await Promise.all([
        getWordsByPage(pageNumber),
        getQcfFont(pageNumber),
        getPageMarkers(pageNumber),
      ]);

      if (!mountedRef.current) return;

      if (!fontBase64) {
        setError('font_load_error');
        setLoading(false);
        return;
      }

      if (words.length === 0) {
        setError('page_load_error');
        setLoading(false);
        return;
      }

      // Single pass: detect surah start + bismillah eligibility
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

      const bismillah = needsBismillah ? (await getBismillahData()) ?? undefined : undefined;

      if (!mountedRef.current) return;

      const generatedHtml = generateMushafHtml({ pageNumber, words, fontBase64, surahNumber, bismillah, markers });
      cacheHtml(pageNumber, generatedHtml);
      setHtml(generatedHtml);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError('page_load_error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [pageNumber]);

  useEffect(() => {
    mountedRef.current = true;
    loadPage();
    return () => { mountedRef.current = false; };
  }, [loadPage]);

  return { html, loading, error, retry: loadPage };
}

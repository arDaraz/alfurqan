import { useState, useEffect, useCallback, useRef } from 'react';
import { getWordsByPage, getQcfFont } from '../data/quranRepository';
import { generateMushafHtml } from '../components/quran/mushafHtml';

const MAX_CACHE_SIZE = 10;

// Module-level LRU cache shared across all hook instances
const htmlCache = new Map<number, string>();

function cacheHtml(pageNumber: number, html: string): void {
  if (htmlCache.size >= MAX_CACHE_SIZE) {
    // Delete oldest entry (first key)
    const firstKey = htmlCache.keys().next().value;
    if (firstKey !== undefined) htmlCache.delete(firstKey);
  }
  htmlCache.set(pageNumber, html);
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
      const [words, fontBase64] = await Promise.all([
        getWordsByPage(pageNumber),
        getQcfFont(pageNumber),
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

      const generatedHtml = generateMushafHtml(pageNumber, words, fontBase64);
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

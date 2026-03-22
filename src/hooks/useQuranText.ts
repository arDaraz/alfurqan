import { useState, useEffect } from 'react';
import { getAyahsBySurah } from '../data/quranRepository';
import type { Ayah } from '../data/types';

export function useQuranText(surahNumber: number) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAyahsBySurah(surahNumber);
        if (!cancelled) {
          setAyahs(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load ayahs');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [surahNumber]);

  return { ayahs, loading, error };
}

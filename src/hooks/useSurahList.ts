import { useState, useEffect, useCallback } from 'react';
import { getSurahs } from '../data/quranRepository';
import type { Surah } from '../data/types';

export function useSurahList() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSurahs();
      setSurahs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load surahs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { surahs, loading, error, retry: load };
}

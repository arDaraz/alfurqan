import { useState, useEffect, useCallback } from 'react';
import { getSurahs } from '../data/quranRepository';
import type { Surah } from '../data/types';

export function useSurahList() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getSurahs();
      setSurahs(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { surahs, loading, error, retry: load };
}

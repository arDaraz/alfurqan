import { useState, useEffect, useCallback } from 'react';
import { getJuzList } from '../data/quranRepository';
import type { Juz } from '../data/types';

export function useJuzList() {
  const [juzList, setJuzList] = useState<Juz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getJuzList();
      setJuzList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load juz list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { juzList, loading, error, retry: load };
}

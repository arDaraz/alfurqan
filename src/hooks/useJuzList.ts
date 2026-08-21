import { useState, useEffect, useCallback } from 'react';
import { getJuzList } from '../data/quranRepository';
import type { Juz } from '../data/types';

export function useJuzList() {
  const [juzList, setJuzList] = useState<Juz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getJuzList();
      setJuzList(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { juzList, loading, error, retry: load };
}

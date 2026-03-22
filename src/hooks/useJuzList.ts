import { useState, useEffect } from 'react';
import { getJuzList } from '../data/quranRepository';
import type { Juz } from '../data/types';

export function useJuzList() {
  const [juzList, setJuzList] = useState<Juz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getJuzList();
        if (!cancelled) {
          setJuzList(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load juz list');
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
  }, []);

  return { juzList, loading, error };
}

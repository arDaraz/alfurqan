import { useState, useMemo, useEffect } from 'react';
import type { Surah } from '../data/types';

export function useSearch(surahs: Surah[], debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return surahs;
    const q = debouncedQuery.toLowerCase();
    return surahs.filter(
      (s) =>
        s.nameEnglish.toLowerCase().includes(q) ||
        s.nameArabic.includes(debouncedQuery) ||
        s.number.toString() === debouncedQuery.trim()
    );
  }, [surahs, debouncedQuery]);

  return { query, setQuery, filtered };
}

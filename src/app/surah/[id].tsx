import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuranText } from '../../hooks/useQuranText';
import { useLastRead } from '../../hooks/useLastRead';
import { getSurahByNumber } from '../../data/quranRepository';
import { QuranReader } from '../../components/quran/QuranReader';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { theme } from '../../constants/theme';
import type { Surah } from '../../data/types';

/**
 * Surah reader screen.
 * Displays the full Quran reader for a given surah with:
 * - Arabic surah name in navigation header
 * - Loading skeleton during data fetch
 * - Error state with retry
 * - Auto-restore of last-read position
 */
export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahNumber = parseInt(id || '1', 10);

  // Fetch ayahs
  const { ayahs, loading: ayahsLoading, error: ayahsError } = useQuranText(surahNumber);

  // Fetch surah metadata
  const [surah, setSurah] = useState<Surah | null>(null);
  const [surahLoading, setSurahLoading] = useState(true);
  const [surahError, setSurahError] = useState<string | null>(null);

  const loadSurah = useCallback(async () => {
    try {
      setSurahLoading(true);
      setSurahError(null);
      const data = await getSurahByNumber(surahNumber);
      setSurah(data);
    } catch (err) {
      setSurahError(err instanceof Error ? err.message : 'Failed to load surah metadata');
    } finally {
      setSurahLoading(false);
    }
  }, [surahNumber]);

  useEffect(() => {
    loadSurah();
  }, [loadSurah]);

  // Last read position
  const { lastRead } = useLastRead();
  const initialAyahNumber =
    lastRead && lastRead.surahNumber === surahNumber ? lastRead.ayahNumber : undefined;

  // Loading state
  const isLoading = ayahsLoading || surahLoading;

  // Error state
  const error = ayahsError || surahError;

  const handleRetry = useCallback(() => {
    loadSurah();
  }, [loadSurah]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <Text style={styles.headerTitle}>
              {surah?.nameArabic || ''}
            </Text>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1A1A2E',
        }}
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : surah && ayahs.length > 0 ? (
        <QuranReader
          surahNumber={surahNumber}
          surah={surah}
          ayahs={ayahs}
          initialAyahNumber={initialAyahNumber}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2', // Cream background
  },
  headerTitle: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: theme.typography.body.size, // 18px
    color: theme.colors.text, // #1A1A2E
  },
});

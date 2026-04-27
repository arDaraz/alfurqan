import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSurahForPage } from '../../data/quranRepository';
import { handleAyahAction } from '../../actions/ayahActions';
import { MushafReader } from './MushafReader';
import { ReaderHeader } from './ReaderHeader';
import { ReaderToolbar } from './ReaderToolbar';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import type { AyahActionType, AyahSelection } from '../../data/types';

interface Props {
  loadInitialPage: () => Promise<{ page: number; surahName: string }>;
  errorMessage: string;
}

const PAGES_PER_JUZ = 604 / 30;

function juzForPage(page: number): number {
  return Math.max(1, Math.min(30, Math.ceil(page / PAGES_PER_JUZ)));
}

export function MushafScreenLayout({ loadInitialPage, errorMessage }: Props) {
  const { colors, nightReadingEnabled } = useReaderColors();
  const styles = createStyles(colors);
  const [surahName, setSurahName] = useState('');
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [initialPage, setInitialPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadInitialPage();
      setSurahName(result.surahName);
      setInitialPage(result.page);
      setCurrentPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadInitialPage, errorMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = useCallback(
    (action: AyahActionType, selection: AyahSelection) => {
      handleAyahAction(action, selection);
    },
    []
  );

  const handlePageChange = useCallback(async (pageNumber: number) => {
    setCurrentPage(pageNumber);
    try {
      const surah = await getSurahForPage(pageNumber);
      if (surah) {
        setSurahName((prev) =>
          prev === surah.nameArabic ? prev : surah.nameArabic
        );
      }
    } catch {
      /* non-critical */
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {nightReadingEnabled && <StatusBar style="light" />}
      <ReaderHeader
        surahName={surahName}
        juzNumber={juzForPage(currentPage ?? 1)}
        pageNumber={currentPage ?? 1}
      />
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : initialPage !== null ? (
        <View style={styles.body}>
          <MushafReader
            initialPage={initialPage}
            onPageChange={handlePageChange}
            onAyahAction={handleAction}
          />
          <ReaderToolbar />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(colors: ReaderColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, direction: 'rtl' },
    body: { flex: 1 },
  });
}

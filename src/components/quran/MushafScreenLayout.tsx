import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getJuzAndPageForAyah,
  getSurahByNumber,
  getSurahForPage,
} from '../../data/quranRepository';
import { handleAyahAction } from '../../actions/ayahActions';
import { MushafReader } from './MushafReader';
import { ReaderHeader } from './ReaderHeader';
import { BookmarkCategorySheet, type BookmarkCommit } from './BookmarkCategorySheet';
import { BookmarkSavedSnackbar } from './BookmarkSavedSnackbar';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import { useReadingStore } from '../../stores/readingStore';
import type {
  AyahActionType,
  AyahSelection,
  BookmarkCategory,
} from '../../data/types';

interface Props {
  loadInitialPage: () => Promise<{ page: number; surahName: string }>;
  errorMessage: string;
}

const PAGES_PER_JUZ = 604 / 30;
function juzForPage(page: number): number {
  return Math.max(1, Math.min(30, Math.ceil(page / PAGES_PER_JUZ)));
}

interface SnackbarInfo {
  surahName: string;
  page: number;
  juz: number;
  resulting: BookmarkCategory[];
  previous: BookmarkCategory[];
  surahNumber: number;
  ayahNumber: number;
}

export function MushafScreenLayout({ loadInitialPage, errorMessage }: Props) {
  const { colors, nightReadingEnabled } = useReaderColors();
  const styles = createStyles(colors);
  const [surahName, setSurahName] = useState('');
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [initialPage, setInitialPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetSelection, setSheetSelection] = useState<AyahSelection | null>(null);
  const [sheetSurahName, setSheetSurahName] = useState('');
  const [snackbar, setSnackbar] = useState<SnackbarInfo | null>(null);

  const addBookmark = useReadingStore((s) => s.addBookmark);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);
  const getBookmarkCategories = useReadingStore((s) => s.getBookmarkCategories);

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

  const openSheet = useCallback(async (selection: AyahSelection) => {
    setSheetSelection(selection);
    try {
      const s = await getSurahByNumber(selection.startSurah);
      setSheetSurahName(s?.nameArabic ?? '');
    } catch {
      setSheetSurahName('');
    }
  }, []);

  const handleAction = useCallback(
    (action: AyahActionType, selection: AyahSelection) => {
      handleAyahAction(action, selection, {
        onRequestBookmark: (sel) => {
          void openSheet(sel);
        },
      });
    },
    [openSheet]
  );

  const handlePageBookmarkRequest = useCallback(
    (selection: AyahSelection) => {
      void openSheet(selection);
    },
    [openSheet]
  );

  const handleSheetCommit = useCallback(
    async (commit: BookmarkCommit) => {
      if (!sheetSelection) return;
      const { startSurah, startAyah } = sheetSelection;
      commit.added.forEach((c) => addBookmark(startSurah, startAyah, c));
      commit.removed.forEach((c) => removeBookmark(startSurah, startAyah, c));
      try {
        const { juz, page } = await getJuzAndPageForAyah(startSurah, startAyah);
        setSnackbar({
          surahNumber: startSurah,
          ayahNumber: startAyah,
          surahName: sheetSurahName,
          page,
          juz,
          resulting: commit.next,
          previous: commit.previous,
        });
      } catch {
        /* non-critical */
      }
      setSheetSelection(null);
    },
    [sheetSelection, sheetSurahName, addBookmark, removeBookmark]
  );

  const handleSheetDismiss = useCallback(() => setSheetSelection(null), []);

  const handleUndoSnackbar = useCallback(() => {
    if (!snackbar) return;
    const current = getBookmarkCategories(snackbar.surahNumber, snackbar.ayahNumber);
    const prevSet = new Set(snackbar.previous);
    const curSet = new Set(current);
    current.forEach((c) => {
      if (!prevSet.has(c)) removeBookmark(snackbar.surahNumber, snackbar.ayahNumber, c);
    });
    snackbar.previous.forEach((c) => {
      if (!curSet.has(c)) addBookmark(snackbar.surahNumber, snackbar.ayahNumber, c);
    });
    setSnackbar(null);
  }, [snackbar, addBookmark, removeBookmark, getBookmarkCategories]);

  const handleDismissSnackbar = useCallback(() => setSnackbar(null), []);

  const handlePageChange = useCallback(async (pageNumber: number) => {
    setCurrentPage(pageNumber);
    try {
      const surah = await getSurahForPage(pageNumber);
      if (surah) {
        setSurahName((prev) => (prev === surah.nameArabic ? prev : surah.nameArabic));
      }
    } catch {
      /* non-critical */
    }
  }, []);

  const initialCategories =
    sheetSelection !== null
      ? getBookmarkCategories(sheetSelection.startSurah, sheetSelection.startAyah)
      : [];

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
            onPageBookmarkRequest={handlePageBookmarkRequest}
          />
          {sheetSelection && (
            <BookmarkCategorySheet
              surahName={sheetSurahName}
              ayahNumber={sheetSelection.startAyah}
              initialCategories={initialCategories}
              onCommit={handleSheetCommit}
              onDismiss={handleSheetDismiss}
            />
          )}
          {snackbar && (
            <BookmarkSavedSnackbar
              key={`${snackbar.surahNumber}-${snackbar.ayahNumber}-${snackbar.resulting.join('|')}`}
              surahName={snackbar.surahName}
              pageNumber={snackbar.page}
              juzNumber={snackbar.juz}
              resultingCategories={snackbar.resulting}
              onUndo={handleUndoSnackbar}
              onDismiss={handleDismissSnackbar}
            />
          )}
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

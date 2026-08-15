import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getMushafJuzAndPageForAyah,
  getMushafSurahForPage,
  getMushafTopAyahForPage,
  getSurahByNumber,
} from '../../data/quranRepository';
import { handleAyahAction } from '../../actions/ayahActions';
import { MushafReader } from './MushafReader';
import { ReaderHeader } from './ReaderHeader';
import { BookmarkCategorySheet, type BookmarkCommit } from './BookmarkCategorySheet';
import { BookmarkSavedSnackbar } from './BookmarkSavedSnackbar';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { InfoSheet } from '../ui/InfoSheet';
import { getMushafLayout } from '../../data/mushafLayouts';
import { useStrings } from '../../constants/strings';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import { useReadingStore } from '../../stores/readingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import type {
  AyahActionType,
  AyahSelection,
  BookmarkCategory,
  CanonicalQuranLocation,
} from '../../data/types';

export interface InitialMushafPage {
  page: number;
  surahName: string;
  location?: CanonicalQuranLocation;
}

interface Props {
  loadInitialPage: () => Promise<InitialMushafPage>;
  errorMessage: string;
}

interface SnackbarInfo {
  surahName: string;
  page: number;
  juz: number;
  resulting: BookmarkCategory[];
  previous: BookmarkCategory[];
  previousCreatedAt?: Partial<Record<BookmarkCategory, number>>;
  surahNumber: number;
  ayahNumber: number;
  undone?: boolean;
}

export function MushafScreenLayout({ loadInitialPage, errorMessage }: Props) {
  const { colors, nightReadingEnabled } = useReaderColors();
  const strings = useStrings();
  const language = useSettingsStore((state) => state.language);
  const styles = createStyles(colors);
  const [infoVisible, setInfoVisible] = useState(false);
  const [surahName, setSurahName] = useState('');
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [initialPage, setInitialPage] = useState<number | null>(null);
  const [initialLocation, setInitialLocation] = useState<CanonicalQuranLocation | undefined>();
  const [currentJuz, setCurrentJuz] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetSelection, setSheetSelection] = useState<AyahSelection | null>(null);
  const [sheetSurahName, setSheetSurahName] = useState('');
  const [snackbar, setSnackbar] = useState<SnackbarInfo | null>(null);

  const addBookmark = useReadingStore((s) => s.addBookmark);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);
  const getBookmarkCategories = useReadingStore((s) => s.getBookmarkCategories);
  const layoutId = useSettingsStore((state) => state.mushafLayoutId);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadInitialPage();
      setSurahName(result.surahName);
      setInitialPage(result.page);
      setInitialLocation(result.location);
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
      // Captured before the commit so Undo can restore each bookmark's original
      // creation time instead of pushing it to the top of the Bookmarks list.
      const previousCreatedAt: Partial<Record<BookmarkCategory, number>> = {};
      useReadingStore
        .getState()
        .bookmarks.filter((b) => b.surahNumber === startSurah && b.ayahNumber === startAyah)
        .forEach((b) => {
          previousCreatedAt[b.category] = b.createdAt;
        });

      commit.added.forEach((c) => addBookmark(startSurah, startAyah, c));
      commit.removed.forEach((c) => removeBookmark(startSurah, startAyah, c));
      try {
        const { juz, page } = await getMushafJuzAndPageForAyah(
          layoutId,
          startSurah,
          startAyah
        );
        setSnackbar({
          surahNumber: startSurah,
          ayahNumber: startAyah,
          surahName: sheetSurahName,
          page,
          juz,
          resulting: commit.next,
          previous: commit.previous,
          previousCreatedAt,
        });
      } catch {
        /* non-critical */
      }
      setSheetSelection(null);
    },
    [sheetSelection, sheetSurahName, addBookmark, layoutId, removeBookmark]
  );

  const handleSheetDismiss = useCallback(() => setSheetSelection(null), []);

  const handleUndoSnackbar = useCallback(() => {
    if (!snackbar || snackbar.undone) return;
    const current = getBookmarkCategories(snackbar.surahNumber, snackbar.ayahNumber);
    const prevSet = new Set(snackbar.previous);
    const curSet = new Set(current);
    current.forEach((c) => {
      if (!prevSet.has(c)) removeBookmark(snackbar.surahNumber, snackbar.ayahNumber, c);
    });
    snackbar.previous.forEach((c) => {
      if (!curSet.has(c)) {
        addBookmark(
          snackbar.surahNumber,
          snackbar.ayahNumber,
          c,
          snackbar.previousCreatedAt?.[c]
        );
      }
    });
    // Undo can land on an ayah that still holds another category, so the toolbar
    // icon stays filled. Restate the restored categories so the result is visible.
    setSnackbar({ ...snackbar, resulting: snackbar.previous, undone: true });
  }, [snackbar, addBookmark, removeBookmark, getBookmarkCategories]);

  const handleDismissSnackbar = useCallback(() => setSnackbar(null), []);

  const handlePageChange = useCallback(async (pageNumber: number) => {
    setCurrentPage(pageNumber);
    try {
      const [topAyah, surah] = await Promise.all([
        getMushafTopAyahForPage(layoutId, pageNumber),
        getMushafSurahForPage(layoutId, pageNumber),
      ]);
      const { juz } = await getMushafJuzAndPageForAyah(
        layoutId,
        topAyah.surahNumber,
        topAyah.ayahNumber
      );
      setCurrentJuz(juz);
      if (surah) {
        setSurahName((prev) => (prev === surah.nameArabic ? prev : surah.nameArabic));
      }
    } catch {
      /* non-critical */
    }
  }, [layoutId]);

  const initialCategories =
    sheetSelection !== null
      ? getBookmarkCategories(sheetSelection.startSurah, sheetSelection.startAyah)
      : [];

  const readerLayout = getMushafLayout(layoutId);
  const isArabic = language === 'ar';
  const digits = (value: number) => (isArabic ? toArabicIndic(value) : String(value));
  const infoRows = [
    { label: strings.reader.infoSurah, value: surahName || '-' },
    { label: strings.reader.infoJuz, value: digits(currentJuz), numeric: true },
    {
      label: strings.reader.infoPage,
      value: strings.reader.infoPageValue(
        digits(currentPage ?? 1),
        digits(readerLayout.pageCount)
      ),
      numeric: true,
    },
    {
      label: strings.reader.infoMushaf,
      value: isArabic ? readerLayout.displayName.ar : readerLayout.displayName.en,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {nightReadingEnabled && <StatusBar style="light" />}
      <ReaderHeader
        surahName={surahName}
        juzNumber={currentJuz}
        pageNumber={currentPage ?? 1}
        onMore={() => setInfoVisible(true)}
      />
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : initialPage !== null ? (
        <View style={styles.body}>
          <MushafReader
            key={`${layoutId}-${initialPage}`}
            initialPage={initialPage}
            initialLocation={initialLocation}
            layoutId={layoutId}
            onPageChange={handlePageChange}
            onAyahAction={handleAction}
            onPageBookmarkRequest={handlePageBookmarkRequest}
            onPageInfoRequest={() => setInfoVisible(true)}
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
              key={`${snackbar.surahNumber}-${snackbar.ayahNumber}-${snackbar.resulting.join('|')}-${snackbar.undone ? 'undone' : 'saved'}`}
              surahName={snackbar.surahName}
              pageNumber={snackbar.page}
              juzNumber={snackbar.juz}
              resultingCategories={snackbar.resulting}
              undone={snackbar.undone}
              onUndo={handleUndoSnackbar}
              onDismiss={handleDismissSnackbar}
            />
          )}
        </View>
      ) : null}
      <InfoSheet
        visible={infoVisible}
        title={strings.reader.pageOptions}
        rows={infoRows}
        note={language === 'ar' ? readerLayout.attribution.ar : readerLayout.attribution.en}
        onClose={() => setInfoVisible(false)}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ReaderColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, direction: 'rtl' },
    body: { flex: 1 },
  });
}

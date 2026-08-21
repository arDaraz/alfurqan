import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getMushafJuzAndPageForAyah,
  getMushafSurahForPage,
  getMushafTopAyahForPage,
  MushafContentPackError,
} from '../../data/quranRepository';
import { handleAyahAction } from '../../actions/ayahActions';
import { MushafReader } from './MushafReader';
import { ReaderHeader } from './ReaderHeader';
import { BookmarkCategorySheet } from './BookmarkCategorySheet';
import { BookmarkSavedSnackbar } from './BookmarkSavedSnackbar';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { InfoSheet } from '../ui/InfoSheet';
import { getMushafLayout } from '../../data/mushafLayouts';
import { useStrings } from '../../constants/strings';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import { useBookmarkFlow } from '../../hooks/useBookmarkFlow';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import type {
  AyahActionType,
  AyahSelection,
  CanonicalQuranLocation,
} from '../../data/types';

export interface InitialMushafPage {
  page: number;
  surahName: string;
  location?: CanonicalQuranLocation;
}

interface Props {
  loadInitialPage: () => Promise<InitialMushafPage>;
}

type LoadError = 'page_load_error' | 'content_pack_error';

export function MushafScreenLayout({ loadInitialPage }: Props) {
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
  const [error, setError] = useState<LoadError | null>(null);

  const bookmarkFlow = useBookmarkFlow();
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
      // A thrown message is written for a developer and is always English.
      setError(
        err instanceof MushafContentPackError && err.code !== 'out_of_range'
          ? 'content_pack_error'
          : 'page_load_error'
      );
    } finally {
      setLoading(false);
    }
  }, [loadInitialPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = useCallback(
    (action: AyahActionType, selection: AyahSelection) => {
      if (action === 'bookmark') {
        bookmarkFlow.requestBookmark(selection);
        return;
      }
      void handleAyahAction(action, selection);
    },
    [bookmarkFlow]
  );

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
      numeric: true,
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
        <ErrorState
          message={
            error === 'content_pack_error'
              ? strings.mushafContentPackError
              : strings.mushafPageLoadError
          }
          onRetry={loadData}
        />
      ) : initialPage !== null ? (
        <View style={styles.body}>
          <MushafReader
            key={`${layoutId}-${initialPage}`}
            initialPage={initialPage}
            initialLocation={initialLocation}
            layoutId={layoutId}
            onPageChange={handlePageChange}
            onAyahAction={handleAction}
            onPageBookmarkRequest={bookmarkFlow.requestBookmark}
            onPageInfoRequest={() => setInfoVisible(true)}
          />
        </View>
      ) : null}
      {/* Outside the reader body: the native pager paints over its own siblings,
          which leaves these in the tree but not tappable. */}
      {bookmarkFlow.sheet && <BookmarkCategorySheet {...bookmarkFlow.sheet} />}
      {bookmarkFlow.snackbar && (
        <BookmarkSavedSnackbar
          key={`${bookmarkFlow.snackbar.resultingCategories.join('|')}-${bookmarkFlow.snackbar.undone ? 'undone' : 'saved'}`}
          {...bookmarkFlow.snackbar}
        />
      )}
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

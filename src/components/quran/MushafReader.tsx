import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { MushafPage } from './MushafPage';
import { AyahPopup } from './AyahPopup';
import { MiniPlayerBar } from './MiniPlayerBar';
import { MushafBottomToolbar } from './MushafBottomToolbar';
import { BookmarkSavedSnackbar } from './BookmarkSavedSnackbar';
import {
  getJuzAndPageForAyah,
  getPageForAyah,
  getSurahByNumber,
  getSurahLastAyah,
  getTopAyahForPage,
} from '../../data/quranRepository';
import { recitationEngine } from '../../services/recitationEngine';
import { useReadingStore } from '../../stores/readingStore';
import { useRecitationStore } from '../../stores/recitationStore';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import type { AyahSelection, AyahActionType } from '../../data/types';

const TOTAL_PAGES = 604;
const PAGE_RENDER_BUFFER = 2;

interface MushafReaderProps {
  initialPage: number;
  onPageChange?: (pageNumber: number) => void;
  onAyahAction?: (action: AyahActionType, selection: AyahSelection) => void;
}

export async function startToolbarRecitationFromPage(pageNumber: number): Promise<void> {
  const playbackState = useRecitationStore.getState().state;
  if (playbackState === 'playing' || playbackState === 'loading') return;
  if (playbackState === 'paused') {
    await recitationEngine.resume();
    return;
  }

  const topAyah = await getTopAyahForPage(pageNumber);
  const stopAyah = await getSurahLastAyah(topAyah.surahNumber);
  await recitationEngine.start({
    surah: topAyah.surahNumber,
    startAyah: topAyah.ayahNumber,
    stopAyah,
    trigger: 'toolbar',
  });
}

interface PageTopAyahInfo {
  surahNumber: number;
  ayahNumber: number;
  juz: number;
  page: number;
  surahName: string;
}

export function MushafReader({ initialPage, onPageChange, onAyahAction }: MushafReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const currentPageRef = useRef(initialPage);
  const pagerRef = useRef<PagerView>(null);
  const { colors } = useReaderColors();
  const styles = createStyles(colors);
  const setLastRead = useReadingStore((s) => s.setLastRead);
  const bookmarks = useReadingStore((s) => s.bookmarks);
  const addBookmark = useReadingStore((s) => s.addBookmark);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);
  const playbackRange = useRecitationStore((s) => s.range);
  const playbackAyah = useRecitationStore((s) => s.currentAyah);
  const playbackState = useRecitationStore((s) => s.state);

  // Selection state
  const [selection, setSelection] = useState<AyahSelection | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const clearSelectionRef = useRef<(() => void) | null>(null);

  // Page bookmark state — top ayah of the current page + last-saved snackbar info
  const [pageTopAyah, setPageTopAyah] = useState<PageTopAyahInfo | null>(null);
  const [lastSaved, setLastSaved] = useState<PageTopAyahInfo | null>(null);

  const applyPageChange = useCallback(
    (pageNumber: number) => {
      currentPageRef.current = pageNumber;
      setCurrentPage(pageNumber);
      setLastSaved(null);
      setPageTopAyah(null);
      (async () => {
        try {
          const topAyah = await getTopAyahForPage(pageNumber);
          const [{ juz }, surah] = await Promise.all([
            getJuzAndPageForAyah(topAyah.surahNumber, topAyah.ayahNumber),
            getSurahByNumber(topAyah.surahNumber),
          ]);
          if (currentPageRef.current !== pageNumber) return;
          setLastRead(topAyah.surahNumber, topAyah.ayahNumber, juz, pageNumber);
          setPageTopAyah({
            surahNumber: topAyah.surahNumber,
            ayahNumber: topAyah.ayahNumber,
            juz,
            page: pageNumber,
            surahName: surah?.nameArabic ?? '',
          });
        } catch {
          /* non-critical */
        }
      })();
      onPageChange?.(pageNumber);
      setSelection(null);
      setShowActions(false);
      clearSelectionRef.current?.();
    },
    [setLastRead, onPageChange]
  );

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const pageNumber = event.nativeEvent.position + 1;
      applyPageChange(pageNumber);
    },
    [applyPageChange]
  );

  useEffect(() => {
    applyPageChange(initialPage);
  }, [applyPageChange, initialPage]);

  useEffect(() => {
    let cancelled = false;
    const playbackSurah = playbackRange?.surah;
    if (!playbackSurah || playbackAyah === null || playbackState === 'idle' || playbackState === 'error') {
      return undefined;
    }

    getPageForAyah(playbackSurah, playbackAyah)
      .then((pageNumber) => {
        if (cancelled || pageNumber === currentPageRef.current) return;
        pagerRef.current?.setPage(pageNumber - 1);
        applyPageChange(pageNumber);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [playbackRange?.surah, playbackAyah, playbackState, applyPageChange]);

  const handleSelectionEvent = useCallback((data: any) => {
    if (data.type === 'select') {
      setSelection({
        startSurah: data.startSurah,
        startAyah: data.startAyah,
        endSurah: data.endSurah,
        endAyah: data.endAyah,
      });
      setShowActions(Boolean(data.openMenu));
      if (data.openMenu) {
        setPopupPos({ x: data.x, y: data.y });
      }
    } else if (data.type === 'deselect') {
      setSelection(null);
      setShowActions(false);
    }
  }, []);

  const handleAction = useCallback((action: AyahActionType, sel: AyahSelection) => {
    onAyahAction?.(action, sel);
    setSelection(null);
    setShowActions(false);
    clearSelectionRef.current?.();
  }, [onAyahAction]);

  const handleDismiss = useCallback(() => {
    setSelection(null);
    setShowActions(false);
    clearSelectionRef.current?.();
  }, []);

  const handleToolbarPlay = useCallback(() => {
    void startToolbarRecitationFromPage(currentPage);
  }, [currentPage]);

  const bookmarkActive = useMemo(() => {
    if (!pageTopAyah) return false;
    return bookmarks.some(
      (b) =>
        b.surahNumber === pageTopAyah.surahNumber &&
        b.ayahNumber === pageTopAyah.ayahNumber &&
        b.category === 'reading'
    );
  }, [bookmarks, pageTopAyah]);

  const handleBookmarkPress = useCallback(() => {
    if (!pageTopAyah) return;
    if (bookmarkActive) {
      removeBookmark(pageTopAyah.surahNumber, pageTopAyah.ayahNumber, 'reading');
      setLastSaved(null);
      return;
    }
    addBookmark(pageTopAyah.surahNumber, pageTopAyah.ayahNumber, 'reading');
    setLastSaved(pageTopAyah);
  }, [pageTopAyah, bookmarkActive, addBookmark, removeBookmark]);

  const handleUndoBookmark = useCallback(() => {
    if (!lastSaved) return;
    removeBookmark(lastSaved.surahNumber, lastSaved.ayahNumber, 'reading');
    setLastSaved(null);
  }, [lastSaved, removeBookmark]);

  const handleDismissSnackbar = useCallback(() => {
    setLastSaved(null);
  }, []);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage - 1}
        offscreenPageLimit={1}
        layoutDirection="rtl"
        onPageSelected={handlePageSelected}
      >
        {Array.from({ length: TOTAL_PAGES }, (_, index) => {
          const pageNumber = index + 1;
          const isNearby = Math.abs(pageNumber - currentPage) <= PAGE_RENDER_BUFFER;
          return (
            <View key={`page-${pageNumber}`} style={styles.pageContainer}>
              {isNearby ? (
                <MushafPage
                  pageNumber={pageNumber}
                  isActive={pageNumber === currentPage}
                  onSelectionEvent={pageNumber === currentPage ? handleSelectionEvent : undefined}
                  clearSelectionRef={pageNumber === currentPage ? clearSelectionRef : undefined}
                />
              ) : (
                <View style={styles.placeholder}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              )}
            </View>
          );
        })}
      </PagerView>

      {/* Ayah context popup overlay */}
      {selection && showActions && (
        <AyahPopup
          selection={selection}
          x={popupPos.x}
          y={popupPos.y}
          onAction={handleAction}
          onDismiss={handleDismiss}
        />
      )}

      <MiniPlayerBar />
      {lastSaved && (
        <BookmarkSavedSnackbar
          key={`${lastSaved.surahNumber}-${lastSaved.ayahNumber}`}
          surahName={lastSaved.surahName}
          pageNumber={lastSaved.page}
          juzNumber={lastSaved.juz}
          onUndo={handleUndoBookmark}
          onDismiss={handleDismissSnackbar}
        />
      )}
      <MushafBottomToolbar
        onPlayPress={handleToolbarPlay}
        bookmarkActive={bookmarkActive}
        onBookmarkPress={handleBookmarkPress}
      />
    </View>
  );
}

function createStyles(colors: ReaderColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    pager: {
      flex: 1,
    },
    pageContainer: {
      flex: 1,
      overflow: 'hidden',
    },
    placeholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
    },
  });
}

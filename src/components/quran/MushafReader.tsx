import React, { useCallback, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { MushafPage } from './MushafPage';
import { PageIndicator } from './PageIndicator';
import { AyahPopup } from './AyahPopup';
import { MiniPlayerBar } from './MiniPlayerBar';
import { MushafBottomToolbar } from './MushafBottomToolbar';
import { getSurahLastAyah, getTopAyahForPage } from '../../data/quranRepository';
import { recitationEngine } from '../../services/recitationEngine';
import { useReadingStore } from '../../stores/readingStore';
import { useRecitationStore } from '../../stores/recitationStore';
import { theme } from '../../constants/theme';
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

export function MushafReader({ initialPage, onPageChange, onAyahAction }: MushafReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const pagerRef = useRef<PagerView>(null);
  const setLastReadPage = useReadingStore((s) => s.setLastReadPage);

  // Selection state
  const [selection, setSelection] = useState<AyahSelection | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const clearSelectionRef = useRef<(() => void) | null>(null);

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const pageNumber = event.nativeEvent.position + 1;
      setCurrentPage(pageNumber);
      setLastReadPage(pageNumber);
      onPageChange?.(pageNumber);
      // Clear selection on page change
      setSelection(null);
      clearSelectionRef.current?.();
    },
    [setLastReadPage, onPageChange]
  );

  const handleSelectionEvent = useCallback((data: any) => {
    if (data.type === 'select') {
      setSelection({
        startSurah: data.startSurah,
        startAyah: data.startAyah,
        endSurah: data.endSurah,
        endAyah: data.endAyah,
      });
      setPopupPos({ x: data.x, y: data.y });
    } else if (data.type === 'deselect') {
      setSelection(null);
    }
  }, []);

  const handleAction = useCallback((action: AyahActionType, sel: AyahSelection) => {
    onAyahAction?.(action, sel);
    setSelection(null);
    clearSelectionRef.current?.();
  }, [onAyahAction]);

  const handleDismiss = useCallback(() => {
    setSelection(null);
    clearSelectionRef.current?.();
  }, []);

  const handleToolbarPlay = useCallback(() => {
    void startToolbarRecitationFromPage(currentPage);
  }, [currentPage]);

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
                  onSelectionEvent={pageNumber === currentPage ? handleSelectionEvent : undefined}
                  clearSelectionRef={pageNumber === currentPage ? clearSelectionRef : undefined}
                />
              ) : (
                <View style={styles.placeholder}>
                  <ActivityIndicator size="small" color={theme.colors.accent} />
                </View>
              )}
            </View>
          );
        })}
      </PagerView>

      {/* Ayah context popup overlay */}
      {selection && (
        <AyahPopup
          selection={selection}
          x={popupPos.x}
          y={popupPos.y}
          onAction={handleAction}
          onDismiss={handleDismiss}
        />
      )}

      <MiniPlayerBar />
      <MushafBottomToolbar onPlayPress={handleToolbarPlay} />
      <PageIndicator currentPage={currentPage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});

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

export function MushafReader({ initialPage, onPageChange, onAyahAction }: MushafReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const pagerRef = useRef<PagerView>(null);
  const { colors } = useReaderColors();
  const styles = createStyles(colors);
  const setLastReadPage = useReadingStore((s) => s.setLastReadPage);

  // Selection state
  const [selection, setSelection] = useState<AyahSelection | null>(null);
  const [showActions, setShowActions] = useState(false);
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
      setShowActions(false);
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
      <MushafBottomToolbar onPlayPress={handleToolbarPlay} />
      <PageIndicator currentPage={currentPage} />
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

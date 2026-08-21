import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { MushafPage } from './MushafPage';
import { AyahPopup } from './AyahPopup';
import { MiniPlayerBar } from './MiniPlayerBar';
import { MushafBottomToolbar } from './MushafBottomToolbar';
import {
  getMushafJuzAndPageForAyah,
  getMushafPageForAyah,
  getMushafTopAyahForPage,
  getSurahByNumber,
  getSurahLastAyah,
} from '../../data/quranRepository';
import {
  DEFAULT_MUSHAF_LAYOUT_ID,
  getMushafLayout,
  type MushafLayoutId,
} from '../../data/mushafLayouts';
import { recitationEngine } from '../../services/recitationEngine';
import { useReadingStore } from '../../stores/readingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useRecitationStore } from '../../stores/recitationStore';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import type {
  AyahSelection,
  AyahActionType,
  CanonicalQuranLocation,
} from '../../data/types';

interface MushafReaderProps {
  initialPage: number;
  initialLocation?: CanonicalQuranLocation;
  layoutId?: MushafLayoutId;
  onPageChange?: (pageNumber: number) => void;
  onAyahAction?: (action: AyahActionType, selection: AyahSelection) => void;
  onPageBookmarkRequest?: (selection: AyahSelection) => void;
  onPageInfoRequest?: () => void;
}

export async function startToolbarRecitationFromPage(
  pageNumber: number,
  layoutId: MushafLayoutId = DEFAULT_MUSHAF_LAYOUT_ID
): Promise<void> {
  const playbackState = useRecitationStore.getState().state;
  if (playbackState === 'playing' || playbackState === 'loading') return;
  if (playbackState === 'paused') {
    await recitationEngine.resume();
    return;
  }
  const topAyah = await getMushafTopAyahForPage(layoutId, pageNumber);
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

export function getMushafPageWindow(
  currentPage: number,
  pageCount: number
): { pages: number[]; selectedIndex: number } {
  if (pageCount <= 1) return { pages: [1], selectedIndex: 0 };
  if (currentPage <= 1) {
    const pages = Array.from({ length: Math.min(3, pageCount) }, (_, index) => index + 1);
    return { pages, selectedIndex: 0 };
  }
  if (currentPage >= pageCount) {
    const firstPage = Math.max(1, pageCount - 2);
    const pages = Array.from({ length: pageCount - firstPage + 1 }, (_, index) => firstPage + index);
    return { pages, selectedIndex: pages.length - 1 };
  }
  return { pages: [currentPage - 1, currentPage, currentPage + 1], selectedIndex: 1 };
}

export function MushafReader({
  initialPage,
  initialLocation,
  layoutId: requestedLayoutId,
  onPageChange,
  onAyahAction,
  onPageBookmarkRequest,
  onPageInfoRequest,
}: MushafReaderProps) {
  const selectedLayoutId = useSettingsStore((state) => state.mushafLayoutId);
  const layoutId = requestedLayoutId ?? selectedLayoutId;
  const layout = getMushafLayout(layoutId);
  const safeInitialPage = Math.max(1, Math.min(layout.pageCount, initialPage));
  const [currentPage, setCurrentPage] = useState(safeInitialPage);
  const currentPageRef = useRef(safeInitialPage);
  // The mounted window is centred separately from the page being read. Sliding
  // it while a swipe is still settling changes the pager's children underneath
  // it, which leaves the header and the visible page one turn apart.
  const [windowCentre, setWindowCentre] = useState(safeInitialPage);
  const pages = useMemo(
    () => getMushafPageWindow(windowCentre, layout.pageCount),
    [windowCentre, layout.pageCount]
  );
  const { colors } = useReaderColors();
  const styles = createStyles(colors);
  const setLastRead = useReadingStore((state) => state.setLastRead);
  const bookmarks = useReadingStore((state) => state.bookmarks);
  const playbackRange = useRecitationStore((state) => state.range);
  const playbackAyah = useRecitationStore((state) => state.currentAyah);
  const playbackState = useRecitationStore((state) => state.state);
  const [selection, setSelection] = useState<AyahSelection | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const clearSelectionRef = useRef<(() => void) | null>(null);
  const pagerRef = useRef<PagerView>(null);
  const [pageTopAyah, setPageTopAyah] = useState<PageTopAyahInfo | null>(null);

  const applyPageChange = useCallback(
    (
      pageNumber: number,
      locationToPreserve?: CanonicalQuranLocation,
      recentreWindow = true
    ) => {
      if (pageNumber < 1 || pageNumber > layout.pageCount) return;
      currentPageRef.current = pageNumber;
      setCurrentPage(pageNumber);
      // A jump has no gesture to disturb, so its window moves at once. A swipe
      // waits for the pager to go idle.
      if (recentreWindow) setWindowCentre(pageNumber);
      setPageTopAyah(null);
      void (async () => {
        try {
          const topAyah = await getMushafTopAyahForPage(layoutId, pageNumber);
          const [topLocation, surah, preservedLocation] = await Promise.all([
            getMushafJuzAndPageForAyah(layoutId, topAyah.surahNumber, topAyah.ayahNumber),
            getSurahByNumber(topAyah.surahNumber),
            locationToPreserve
              ? getMushafJuzAndPageForAyah(
                  layoutId,
                  locationToPreserve.surahNumber,
                  locationToPreserve.ayahNumber
                )
              : Promise.resolve(null),
          ]);
          if (currentPageRef.current !== pageNumber) return;
          const canPreserveLocation = preservedLocation?.page === pageNumber;
          const readingLocation =
            canPreserveLocation && locationToPreserve ? locationToPreserve : topAyah;
          const readingJuz =
            canPreserveLocation && preservedLocation ? preservedLocation.juz : topLocation.juz;
          setLastRead(
            readingLocation.surahNumber,
            readingLocation.ayahNumber,
            readingJuz,
            pageNumber,
            new Date(),
            layoutId,
            readingLocation.wordPosition ?? null
          );
          setPageTopAyah({
            surahNumber: topAyah.surahNumber,
            ayahNumber: topAyah.ayahNumber,
            juz: topLocation.juz,
            page: pageNumber,
            surahName: surah?.nameArabic ?? '',
          });
        } catch {
          // The page-level error state reports corrupt/missing content packs.
        }
      })();
      onPageChange?.(pageNumber);
      setSelection(null);
      setShowActions(false);
      clearSelectionRef.current?.();
    },
    [layout.pageCount, layoutId, onPageChange, setLastRead]
  );

  useEffect(() => {
    applyPageChange(safeInitialPage, initialLocation);
  }, [applyPageChange, initialLocation, safeInitialPage]);

  // Once the window has moved, the pager is told which of the three it now sits
  // on. The page under it is unchanged, so this is not visible.
  useEffect(() => {
    pagerRef.current?.setPageWithoutAnimation(pages.selectedIndex);
  }, [pages.selectedIndex, pages.pages]);

  useEffect(() => {
    let cancelled = false;
    const playbackSurah = playbackRange?.surah;
    if (
      !playbackSurah ||
      playbackAyah === null ||
      playbackState === 'idle' ||
      playbackState === 'error'
    ) {
      return undefined;
    }
    getMushafPageForAyah(layoutId, playbackSurah, playbackAyah)
      .then((pageNumber) => {
        if (cancelled || pageNumber === currentPageRef.current) return;
        applyPageChange(pageNumber);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [applyPageChange, layoutId, playbackAyah, playbackRange?.surah, playbackState]);

  const handleSelectionEvent = useCallback((data: any) => {
    if (data.type === 'select') {
      setSelection({
        startSurah: data.startSurah,
        startAyah: data.startAyah,
        endSurah: data.endSurah,
        endAyah: data.endAyah,
      });
      setShowActions(Boolean(data.openMenu));
      if (data.openMenu) setPopupPos({ x: data.x, y: data.y });
    } else if (data.type === 'deselect') {
      setSelection(null);
      setShowActions(false);
    }
  }, []);

  const handleAction = useCallback(
    (action: AyahActionType, selected: AyahSelection) => {
      onAyahAction?.(action, selected);
      setSelection(null);
      setShowActions(false);
      clearSelectionRef.current?.();
    },
    [onAyahAction]
  );

  const handleDismiss = useCallback(() => {
    setSelection(null);
    setShowActions(false);
    clearSelectionRef.current?.();
  }, []);

  const bookmarkActive = useMemo(
    () =>
      pageTopAyah != null &&
      bookmarks.some(
        (bookmark) =>
          bookmark.surahNumber === pageTopAyah.surahNumber &&
          bookmark.ayahNumber === pageTopAyah.ayahNumber
      ),
    [bookmarks, pageTopAyah]
  );

  return (
    <View testID="mushaf-reader" style={styles.container}>
      <PagerView
        ref={pagerRef}
        // Keyed on the layout only. Adding the page number remounted all three
        // WebViews on every turn, which re-decoded the page font each time.
        key={layoutId}
        style={styles.pager}
        initialPage={pages.selectedIndex}
        layoutDirection="rtl"
        overdrag={false}
        onPageScroll={() => {
          setSelection(null);
          setShowActions(false);
          clearSelectionRef.current?.();
        }}
        onPageSelected={(event) => {
          const pageNumber = pages.pages[event.nativeEvent.position];
          if (pageNumber != null && pageNumber !== currentPageRef.current) {
            applyPageChange(pageNumber, undefined, false);
          }
        }}
        onPageScrollStateChanged={(event) => {
          if (event.nativeEvent.pageScrollState !== 'idle') return;
          // Safe to move the window now: no gesture is in flight, so changing
          // the pager's children cannot be mistaken for a page turn.
          setWindowCentre((centre) =>
            centre === currentPageRef.current ? centre : currentPageRef.current
          );
        }}
      >
        {pages.pages.map((pageNumber) => (
          <View key={`${layoutId}-page-${pageNumber}`} style={styles.pageContainer} collapsable={false}>
            <MushafPage
              pageNumber={pageNumber}
              layoutId={layoutId}
              isActive={pageNumber === currentPage}
              onSelectionEvent={pageNumber === currentPage ? handleSelectionEvent : undefined}
              clearSelectionRef={pageNumber === currentPage ? clearSelectionRef : undefined}
            />
          </View>
        ))}
      </PagerView>

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
      <MushafBottomToolbar
        onPlayPress={() => void startToolbarRecitationFromPage(currentPage, layoutId)}
        onInfoPress={onPageInfoRequest}
        bookmarkActive={bookmarkActive}
        onBookmarkPress={() => {
          if (!pageTopAyah || !onPageBookmarkRequest) return;
          onPageBookmarkRequest({
            startSurah: pageTopAyah.surahNumber,
            startAyah: pageTopAyah.ayahNumber,
            endSurah: pageTopAyah.surahNumber,
            endAyah: pageTopAyah.ayahNumber,
          });
        }}
      />
    </View>
  );
}

function createStyles(colors: ReaderColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    pager: { flex: 1 },
    pageContainer: { flex: 1, overflow: 'hidden' },
  });
}

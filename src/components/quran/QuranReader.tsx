import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { FlashList, type ViewToken } from '@shopify/flash-list';
import { useSelectionStore } from '../../stores/selectionStore';
import { useReadingStore } from '../../stores/readingStore';
import { AyahText, type AyahSelectionState } from './AyahText';
import { SurahHeaderBanner } from './SurahHeaderBanner';
import { Bismillah } from './Bismillah';
import { RangeSelectionBar } from './RangeSelectionBar';
import { theme } from '../../constants/theme';
import type { Ayah, Surah } from '../../data/types';

// Discriminated union for FlashList data items
type ReaderItem =
  | { type: 'header'; surah: Surah }
  | { type: 'bismillah' }
  | { type: 'ayah'; ayah: Ayah };

interface QuranReaderProps {
  surahNumber: number;
  surah: Surah;
  ayahs: Ayah[];
  initialScrollOffset?: number;
}

/**
 * Full-screen scrollable Quran text view.
 * Uses FlashList with interleaved surah header, Bismillah, and ayah items.
 * Manages ayah selection, auto-bookmark, and range selection bar.
 */
export function QuranReader({
  surahNumber,
  surah,
  ayahs,
  initialScrollOffset,
}: QuranReaderProps) {
  const flashListRef = useRef<FlashList<ReaderItem>>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selection store
  const startSurah = useSelectionStore((s) => s.startSurah);
  const startAyah = useSelectionStore((s) => s.startAyah);
  const endSurah = useSelectionStore((s) => s.endSurah);
  const endAyah = useSelectionStore((s) => s.endAyah);
  const isRangeComplete = useSelectionStore((s) => s.isRangeComplete);
  const setStart = useSelectionStore((s) => s.setStart);
  const setEnd = useSelectionStore((s) => s.setEnd);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  // Reading store for auto-bookmark
  const setLastRead = useReadingStore((s) => s.setLastRead);

  // Clear selection on unmount
  useEffect(() => {
    return () => {
      clearSelection();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [clearSelection]);

  // Scroll to initial offset on mount
  useEffect(() => {
    if (initialScrollOffset && initialScrollOffset > 0 && flashListRef.current) {
      // Small delay to ensure FlashList is ready
      const timer = setTimeout(() => {
        flashListRef.current?.scrollToOffset({
          offset: initialScrollOffset,
          animated: false,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialScrollOffset]);

  // Build data array with header, bismillah (if applicable), and ayahs
  const data = useMemo((): ReaderItem[] => {
    const items: ReaderItem[] = [];

    // Surah header banner
    items.push({ type: 'header', surah });

    // Bismillah: NOT for surah 1 (Al-Fatiha - it's ayah 1) or surah 9 (At-Tawbah - no Bismillah)
    if (surahNumber !== 1 && surahNumber !== 9) {
      items.push({ type: 'bismillah' });
    }

    // All ayahs
    for (const ayah of ayahs) {
      items.push({ type: 'ayah', ayah });
    }

    return items;
  }, [surah, surahNumber, ayahs]);

  // Determine selection state for each ayah
  const getSelectionState = useCallback(
    (ayahNumber: number): AyahSelectionState => {
      if (startAyah === ayahNumber && startSurah === surahNumber) return 'selected-start';
      if (endAyah === ayahNumber && endSurah === surahNumber) return 'selected-end';
      if (
        startAyah !== null &&
        endAyah !== null &&
        startSurah === surahNumber &&
        ayahNumber > startAyah &&
        ayahNumber < endAyah
      ) {
        return 'in-range';
      }
      return 'default';
    },
    [startAyah, endAyah, startSurah, endSurah, surahNumber]
  );

  // Handle ayah tap for selection
  const handleAyahPress = useCallback(
    (ayahNumber: number) => {
      if (!startAyah || (startAyah && endAyah)) {
        // Start new selection (or restart after complete selection)
        clearSelection();
        setStart(surahNumber, ayahNumber);
      } else {
        // Complete the range
        if (ayahNumber < startAyah) {
          // Tapped before start - swap
          const currentStart = startAyah;
          clearSelection();
          setStart(surahNumber, ayahNumber);
          // Need a microtask to ensure clearSelection processes first
          setTimeout(() => {
            setEnd(surahNumber, currentStart);
          }, 0);
        } else if (ayahNumber === startAyah) {
          // Tapped same ayah - deselect
          clearSelection();
        } else {
          setEnd(surahNumber, ayahNumber);
        }
      }
    },
    [startAyah, endAyah, surahNumber, clearSelection, setStart, setEnd]
  );

  // Handle "Start Practice" button
  const handleStartPractice = useCallback(() => {
    Alert.alert('Recitation coming soon', 'This feature will be available in a future update.');
  }, []);

  // Handle "Clear Selection" button
  const handleClearSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Auto-bookmark: track visible ayahs on scroll
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // Find the first visible ayah
      const firstVisibleAyah = viewableItems.find(
        (item) => item.isViewable && (item.item as ReaderItem).type === 'ayah'
      );

      if (firstVisibleAyah && firstVisibleAyah.item) {
        const readerItem = firstVisibleAyah.item as ReaderItem;
        if (readerItem.type === 'ayah') {
          // Debounce the save to avoid excessive writes
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            setLastRead(surahNumber, readerItem.ayah.ayahNumber, 0);
          }, 500);
        }
      }
    },
    [surahNumber, setLastRead]
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
    }),
    []
  );

  // FlashList renderItem
  const renderItem = useCallback(
    ({ item }: { item: ReaderItem }) => {
      switch (item.type) {
        case 'header':
          return <SurahHeaderBanner surah={item.surah} />;
        case 'bismillah':
          return <Bismillah />;
        case 'ayah':
          return (
            <AyahText
              ayah={item.ayah}
              selectionState={getSelectionState(item.ayah.ayahNumber)}
              onPress={handleAyahPress}
            />
          );
        default:
          return null;
      }
    },
    [getSelectionState, handleAyahPress]
  );

  // FlashList item type for optimization
  const getItemType = useCallback((item: ReaderItem) => {
    return item.type;
  }, []);

  // Key extractor
  const keyExtractor = useCallback((item: ReaderItem, index: number) => {
    switch (item.type) {
      case 'header':
        return `header-${item.surah.number}`;
      case 'bismillah':
        return 'bismillah';
      case 'ayah':
        return `ayah-${item.ayah.surahNumber}-${item.ayah.ayahNumber}`;
      default:
        return `item-${index}`;
    }
  }, []);

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={data}
        renderItem={renderItem}
        estimatedItemSize={80}
        getItemType={getItemType}
        keyExtractor={keyExtractor}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.listContent}
      />

      <RangeSelectionBar
        startAyah={startSurah === surahNumber ? startAyah : null}
        endAyah={endSurah === surahNumber ? endAyah : null}
        isRangeComplete={isRangeComplete && startSurah === surahNumber}
        onStartPractice={handleStartPractice}
        onClearSelection={handleClearSelection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // #FAF8F2 cream
  },
  listContent: {
    backgroundColor: theme.colors.background, // #FAF8F2 cream
    paddingBottom: 80, // Extra padding for RangeSelectionBar
  },
});

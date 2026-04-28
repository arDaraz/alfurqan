import React, { useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, Text, Alert, StyleSheet, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSelectionStore } from '../../stores/selectionStore';
import { useReadingStore } from '../../stores/readingStore';
import { type AyahSelectionState } from './AyahText';
import { SurahHeaderBanner } from './SurahHeaderBanner';
import { Bismillah } from './Bismillah';
import { RangeSelectionBar } from './RangeSelectionBar';
import { toArabicIndic } from '../../utils/arabic';
import { theme } from '../../constants/theme';
import { surahHasBismillah } from '../../constants/quran';
import { useStrings } from '../../constants/strings';
import { getJuzAndPageForAyah } from '../../data/quranRepository';
import type { Ayah, Surah } from '../../data/types';

interface QuranReaderProps {
  surahNumber: number;
  surah: Surah;
  ayahs: Ayah[];
  initialAyahNumber?: number;
}

export function QuranReader({
  surahNumber,
  surah,
  ayahs,
  initialAyahNumber,
}: QuranReaderProps) {
  const strings = useStrings();
  const scrollRef = useRef<ScrollView>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store Y positions of ayah layout markers for scroll-to-ayah
  const ayahPositionsRef = useRef<Map<number, number>>(new Map());
  const scrollContentHeightRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);

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

  const saveLastRead = useCallback(
    (ayahNumber: number) => {
      getJuzAndPageForAyah(surahNumber, ayahNumber)
        .then(({ juz, page }) => setLastRead(surahNumber, ayahNumber, juz, page))
        .catch(() => undefined);
    },
    [surahNumber, setLastRead]
  );

  const getClosestAyahForScroll = useCallback(
    (scrollY: number) => {
      let closestAyah = ayahs[0]?.ayahNumber ?? 1;
      for (const [ayahNum, yPos] of ayahPositionsRef.current.entries()) {
        if (yPos <= scrollY + 100) {
          closestAyah = ayahNum;
        }
      }

      if (ayahPositionsRef.current.size > 0 || ayahs.length <= 1) {
        return closestAyah;
      }

      const scrollableHeight = Math.max(
        scrollContentHeightRef.current - scrollViewportHeightRef.current,
        1
      );
      const progress = Math.max(0, Math.min(1, scrollY / scrollableHeight));
      const estimatedIndex = Math.min(
        ayahs.length - 1,
        Math.max(0, Math.round(progress * (ayahs.length - 1)))
      );
      return ayahs[estimatedIndex]?.ayahNumber ?? closestAyah;
    },
    [ayahs]
  );

  useEffect(() => {
    const firstAyah = initialAyahNumber ?? ayahs[0]?.ayahNumber;
    if (firstAyah === undefined) return;

    saveLastRead(firstAyah);
  }, [ayahs, initialAyahNumber, saveLastRead]);

  // Clear selection on unmount
  useEffect(() => {
    return () => {
      clearSelection();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [clearSelection]);

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
        clearSelection();
        setStart(surahNumber, ayahNumber);
      } else {
        if (ayahNumber < startAyah) {
          const currentStart = startAyah;
          clearSelection();
          setStart(surahNumber, ayahNumber);
          setTimeout(() => {
            setEnd(surahNumber, currentStart);
          }, 0);
        } else if (ayahNumber === startAyah) {
          clearSelection();
        } else {
          setEnd(surahNumber, ayahNumber);
        }
      }
    },
    [startAyah, endAyah, surahNumber, clearSelection, setStart, setEnd]
  );

  const handleStartPractice = useCallback(() => {
    Alert.alert(strings.practiceComingSoon, strings.practiceComingSoonMsg);
  }, [strings.practiceComingSoon, strings.practiceComingSoonMsg]);

  // Save reading activity on scroll using the closest available ayah estimate.
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveLastRead(getClosestAyahForScroll(scrollY));
      }, 500);
    },
    [getClosestAyahForScroll, saveLastRead]
  );

  // Get highlight style for selected ayahs in flowing text
  const getAyahHighlight = useCallback(
    (ayahNumber: number) => {
      const state = getSelectionState(ayahNumber);
      if (state !== 'default') {
        return { backgroundColor: theme.colors.selectedRange };
      }
      return {};
    },
    [getSelectionState]
  );

  const getMarkerColor = useCallback(
    (ayahNumber: number) => {
      const state = getSelectionState(ayahNumber);
      return state !== 'default' ? theme.colors.primary : theme.colors.accent;
    },
    [getSelectionState]
  );

  const showBismillah = surahHasBismillah(surahNumber);

  return (
    <View style={styles.container}>
      <ScrollView
        testID="quran-reader-scroll"
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={(_, height) => {
          scrollContentHeightRef.current = height;
        }}
        onLayout={(event) => {
          scrollViewportHeightRef.current = event.nativeEvent.layout.height;
        }}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
      >
        <SurahHeaderBanner surah={surah} />
        {showBismillah && <Bismillah />}

        {/* Flowing Mushaf-style text — all ayahs in a single paragraph */}
        <Text style={styles.mushafText}>
          {ayahs.map((ayah) => (
            <Text
              key={ayah.ayahNumber}
              onPress={() => handleAyahPress(ayah.ayahNumber)}
              style={getAyahHighlight(ayah.ayahNumber)}
            >
              {ayah.textUthmani}
              <Text style={[styles.endMarker, { color: getMarkerColor(ayah.ayahNumber) }]}>
                {' \u06DD'}{toArabicIndic(ayah.ayahNumber)}{' '}
              </Text>
            </Text>
          ))}
        </Text>
      </ScrollView>

      <RangeSelectionBar
        startAyah={startSurah === surahNumber ? startAyah : null}
        endAyah={endSurah === surahNumber ? endAyah : null}
        isRangeComplete={isRangeComplete && startSurah === surahNumber}
        onStartPractice={handleStartPractice}
        onClearSelection={clearSelection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mushafText: {
    fontFamily: theme.fonts.quran,
    fontSize: 26,
    lineHeight: 52,
    color: theme.colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  endMarker: {
    fontSize: 18,
  },
});

import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';

import { useStrings } from '../../constants/strings';
import { useJuzList } from '../../hooks/useJuzList';
import { useSurahList } from '../../hooks/useSurahList';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Juz, Surah } from '../../data/types';

import { JuzListItem } from '../home/JuzListItem';
import { PillTabs } from '../home/PillTabs';
import { SurahListItem } from '../home/SurahListItem';
import { ErrorState } from '../ui/ErrorState';

/**
 * Surah and juz browser. It is the Search tab's resting state, so a reader can
 * reach any surah without typing anything.
 */
export function SurahBrowser() {
  const router = useRouter();
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme);

  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);

  const { surahs, loading: surahsLoading, error: surahsError, retry: surahRetry } = useSurahList();
  const { juzList, loading: juzLoading, error: juzError, retry: juzRetry } = useJuzList();

  const surahNames = useMemo(
    () => new Map(surahs.map((s) => [s.number, isArabic ? s.nameArabic : s.nameEnglish])),
    [surahs, isArabic]
  );

  // Selection marks the row the reader was opened from, so it is set, never toggled.
  const handleSurahSelect = useCallback((n: number) => setSelectedSurah(n), []);
  const handleSurahOpen = useCallback((n: number) => router.push(`/surah/${n}`), [router]);
  const handleJuzSelect = useCallback((n: number) => setSelectedJuz(n), []);
  const handleJuzOpen = useCallback((n: number) => router.push(`/juz/${n}`), [router]);
  const handleRetry = useCallback(() => {
    surahRetry();
    juzRetry();
  }, [surahRetry, juzRetry]);

  const error = surahsError || juzError;
  if (error) return <ErrorState onRetry={handleRetry} />;

  if (surahsLoading || juzLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.semantic.primary} />
      </View>
    );
  }

  const renderSurahItem = ({ item }: { item: Surah }) => (
    <SurahListItem
      surah={item}
      onSelect={handleSurahSelect}
      onOpen={handleSurahOpen}
      isActive={item.number === selectedSurah}
    />
  );
  const renderJuzItem = ({ item }: { item: Juz }) => (
    <JuzListItem
      juz={item}
      surahNames={surahNames}
      onSelect={handleJuzSelect}
      onOpen={handleJuzOpen}
      isActive={item.number === selectedJuz}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <PillTabs
          tabs={[
            { id: 'surah', label: strings.tabSurah },
            { id: 'juz', label: strings.tabJuz },
          ] as const}
          active={activeTab}
          onChange={setActiveTab}
        />
      </View>
      {activeTab === 'surah' ? (
        <FlashList
          data={surahs}
          renderItem={renderSurahItem}
          keyExtractor={(s) => `surah-${s.number}`}
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlashList
          data={juzList}
          renderItem={renderJuzItem}
          keyExtractor={(j) => `juz-${j.number}`}
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabs: {
      paddingHorizontal: theme.gutter.screen - 6,
      paddingBottom: theme.spacing.sm + 2,
    },
    listContent: {
      paddingBottom: 80,
    },
  });
}

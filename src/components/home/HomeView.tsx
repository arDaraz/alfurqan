import React, { useState, useMemo, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSurahList } from '../../hooks/useSurahList';
import { useJuzList } from '../../hooks/useJuzList';
import { useSearch } from '../../hooks/useSearch';
import { useReadingStore } from '../../stores/readingStore';
import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

import { BrandBar } from './BrandBar';
import { GreetingCard } from './GreetingCard';
import { PillTabs } from './PillTabs';
import { SearchBar } from './SearchBar';
import { SurahListItem } from './SurahListItem';
import { JuzListItem } from './JuzListItem';
import { EmptySearchResult } from '../ui/EmptySearchResult';
import { ErrorState } from '../ui/ErrorState';

import type { Surah, Juz } from '../../data/types';

interface Props {
  /** Hide the brand bar + greeting card (used by the Surahs tab). */
  hideGreeting?: boolean;
}

export function HomeView({ hideGreeting = false }: Props) {
  const router = useRouter();
  const strings = useStrings();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const isArabic = language === 'ar';
  const styles = createStyles(theme, isArabic);

  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const { surahs, loading: surahsLoading, error: surahsError, retry: surahRetry } = useSurahList();
  const { juzList, loading: juzLoading, error: juzError, retry: juzRetry } = useJuzList();
  const { query, setQuery, filtered } = useSearch(surahs);

  const lastReadSurah = useReadingStore((s) => s.lastReadSurah);
  const lastReadAyah = useReadingStore((s) => s.lastReadAyah);
  const lastReadJuz = useReadingStore((s) => s.lastReadJuz);
  const lastReadPage = useReadingStore((s) => s.lastReadPage);
  const lastReadAt = useReadingStore((s) => s.lastReadAt);

  const surahNames = useMemo(
    () => new Map(surahs.map((s) => [s.number, isArabic ? s.nameArabic : s.nameEnglish])),
    [surahs, isArabic]
  );

  const handleSurahSelect = useCallback((n: number) => setSelectedSurah((prev) => prev === n ? null : n), []);
  const handleSurahOpen = useCallback((n: number) => router.push(`/surah/${n}`), [router]);
  const handleJuzSelect = useCallback((n: number) => setSelectedJuz((prev) => prev === n ? null : n), []);
  const handleJuzOpen = useCallback((n: number) => router.push(`/juz/${n}`), [router]);

  const handleResume = useCallback(() => {
    if (lastReadSurah !== null) {
      if (lastReadPage !== null) {
        router.push({
          pathname: '/surah/[id]',
          params: { id: String(lastReadSurah), page: String(lastReadPage) },
        });
      } else {
        router.push(`/surah/${lastReadSurah}`);
      }
    } else {
      router.push('/surah/1');
    }
  }, [router, lastReadSurah, lastReadPage]);

  const handleStart = useCallback(() => {
    router.push('/surah/1');
  }, [router]);

  const handleRetry = useCallback(() => {
    surahRetry();
    juzRetry();
  }, [surahRetry, juzRetry]);

  const isLoading = surahsLoading || juzLoading;
  const error = surahsError || juzError;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={theme.semantic.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top']}>
        <ErrorState message={error} onRetry={handleRetry} />
      </SafeAreaView>
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

  const hasLastRead =
    lastReadSurah !== null &&
    lastReadAyah !== null &&
    lastReadJuz !== null &&
    lastReadPage !== null &&
    lastReadAt !== null;
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!hideGreeting && <BrandBar />}

      {!hideGreeting && (
        hasLastRead ? (
          <GreetingCard
            variant="continue"
            surahName={surahNames.get(lastReadSurah) ?? (isArabic ? 'الفاتحة' : 'Al-Fatihah')}
            ayahNumber={lastReadAyah}
            juzNumber={lastReadJuz}
            pageNumber={lastReadPage}
            onResume={handleResume}
          />
        ) : (
          <GreetingCard variant="cold-start" onStart={handleStart} />
        )
      )}

      <View style={styles.controls}>
        <PillTabs
          tabs={[
            { id: 'surah', label: strings.tabSurah },
            { id: 'juz', label: strings.tabJuz },
          ] as const}
          active={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === 'surah' && (
          <View style={styles.searchSpacer}>
            <SearchBar value={query} onChangeText={setQuery} />
          </View>
        )}
      </View>

      <View style={styles.list}>
        {activeTab === 'surah' ? (
          <FlashList
            data={filtered}
            renderItem={renderSurahItem}
            keyExtractor={(s) => `surah-${s.number}`}
            contentContainerStyle={{ paddingBottom: 80 }}
            ListEmptyComponent={query.length > 0 ? <EmptySearchResult query={query} /> : null}
          />
        ) : (
          <FlashList
            data={juzList}
            renderItem={renderJuzItem}
            keyExtractor={(j) => `juz-${j.number}`}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
      direction: isArabic ? 'rtl' : 'ltr',
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
      direction: isArabic ? 'rtl' : 'ltr',
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
      direction: isArabic ? 'rtl' : 'ltr',
    },
    controls: {
      paddingHorizontal: theme.gutter.screen - 6,
      gap: 10,
      paddingTop: 4,
      paddingBottom: theme.spacing.sm + 2,
    },
    searchSpacer: {},
    list: {
      flex: 1,
    },
  });
}

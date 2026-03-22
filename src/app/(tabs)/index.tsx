import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSurahList } from '../../hooks/useSurahList';
import { useJuzList } from '../../hooks/useJuzList';
import { useSearch } from '../../hooks/useSearch';
import { useReadingStore } from '../../stores/readingStore';
import { SurahListItem } from '../../components/home/SurahListItem';
import { JuzListItem } from '../../components/home/JuzListItem';
import { SearchBar } from '../../components/home/SearchBar';
import { TabBar } from '../../components/home/TabBar';
import { ResumeReadingFAB } from '../../components/home/ResumeReadingFAB';
import { EmptySearchResult } from '../../components/ui/EmptySearchResult';
import { ErrorState } from '../../components/ui/ErrorState';
import { theme } from '../../constants/theme';
import type { Surah, Juz } from '../../data/types';

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');

  // Data hooks
  const { surahs, loading: surahsLoading, error: surahsError } = useSurahList();
  const { juzList, loading: juzLoading, error: juzError } = useJuzList();
  const { query, setQuery, filtered } = useSearch(surahs);

  // Reading store for FAB
  const lastReadSurah = useReadingStore((state) => state.lastReadSurah);

  // Build surah names map for JuzListItem
  const surahNames = useMemo(
    () => new Map(surahs.map((s) => [s.number, s.nameArabic])),
    [surahs]
  );

  // Navigation handlers
  const handleSurahPress = useCallback(
    (surahNumber: number) => {
      router.push(`/surah/${surahNumber}`);
    },
    [router]
  );

  const handleJuzPress = useCallback(
    (juzNumber: number) => {
      const juz = juzList.find((j) => j.number === juzNumber);
      if (juz) {
        router.push(`/surah/${juz.startSurah}`);
      }
    },
    [router, juzList]
  );

  const handleResumeFABPress = useCallback(() => {
    if (lastReadSurah !== null) {
      router.push(`/surah/${lastReadSurah}`);
    }
  }, [router, lastReadSurah]);

  // Retry handler for error state
  const handleRetry = useCallback(() => {
    // Hooks re-run on remount; for now, a simple approach
    // is to force re-render via a key change on the parent
    // In practice, useSurahList/useJuzList re-fetch on mount
    // The user can pull-to-refresh or navigate away and back
  }, []);

  // Loading state
  const isLoading = surahsLoading || juzLoading;
  const error = surahsError || juzError;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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

  // Render functions for FlashList
  const renderSurahItem = ({ item }: { item: Surah }) => (
    <SurahListItem
      surah={item}
      onPress={handleSurahPress}
      isActive={item.number === lastReadSurah}
    />
  );

  const renderJuzItem = ({ item }: { item: Juz }) => (
    <JuzListItem
      juz={item}
      surahNames={surahNames}
      onPress={handleJuzPress}
    />
  );

  const surahKeyExtractor = (item: Surah) => `surah-${item.number}`;
  const juzKeyExtractor = (item: Juz) => `juz-${item.number}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Screen Title */}
      <Text style={styles.title}>Tasmi'</Text>

      {/* Search Bar - only visible for surah tab */}
      {activeTab === 'surah' && (
        <View style={styles.searchContainer}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>
      )}

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <View style={styles.listContainer}>
        {activeTab === 'surah' ? (
          <FlashList
            data={filtered}
            renderItem={renderSurahItem}
            keyExtractor={surahKeyExtractor}
            estimatedItemSize={72}
            ListEmptyComponent={
              query.length > 0 ? <EmptySearchResult query={query} /> : null
            }
          />
        ) : (
          <FlashList
            data={juzList}
            renderItem={renderJuzItem}
            keyExtractor={juzKeyExtractor}
            estimatedItemSize={64}
          />
        )}
      </View>

      {/* Resume Reading FAB */}
      <ResumeReadingFAB onPress={handleResumeFABPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F2',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  title: {
    fontSize: theme.typography.heading.size,
    fontWeight: theme.typography.heading.weight,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.xl,
  },
  listContainer: {
    flex: 1,
  },
});

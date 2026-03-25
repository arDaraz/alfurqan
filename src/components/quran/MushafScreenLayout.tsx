import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSurahForPage } from '../../data/quranRepository';
import { handleAyahAction } from '../../actions/ayahActions';
import { MushafReader } from './MushafReader';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { theme } from '../../constants/theme';
import type { AyahActionType, AyahSelection } from '../../data/types';

interface Props {
  loadInitialPage: () => Promise<{ page: number; surahName: string }>;
  errorMessage: string;
}

export function MushafScreenLayout({ loadInitialPage, errorMessage }: Props) {
  const router = useRouter();
  const [surahName, setSurahName] = useState('');
  const [initialPage, setInitialPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadInitialPage();
      setSurahName(result.surahName);
      setInitialPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadInitialPage, errorMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = useCallback((action: AyahActionType, selection: AyahSelection) => {
    handleAyahAction(action, selection);
  }, []);

  const handlePageChange = useCallback(async (pageNumber: number) => {
    try {
      const surah = await getSurahForPage(pageNumber);
      if (surah) setSurahName((prev) => prev === surah.nameArabic ? prev : surah.nameArabic);
    } catch {
      // Header stays on previous surah name — non-critical
    }
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: false,
          headerTitle: () => (
            <Text style={styles.headerTitle}>{surahName}</Text>
          ),
          headerLeft: () => (
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
              hitSlop={8}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.text} />
            </Pressable>
          ),
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
        }}
      />
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : initialPage !== null ? (
        <MushafReader initialPage={initialPage} onPageChange={handlePageChange} onAyahAction={handleAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontFamily: theme.fonts.arabic,
    fontSize: theme.typography.body.size,
    color: theme.colors.text,
  },
  backButton: {
    marginRight: 8,
  },
});

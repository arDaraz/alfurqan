import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { getPageForJuz } from '../../data/quranRepository';
import { MushafReader } from '../../components/quran/MushafReader';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { useStrings } from '../../constants/strings';
import { theme } from '../../constants/theme';

export default function JuzScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const juzNumber = parseInt(id || '1', 10);
  const strings = useStrings();

  const [initialPage, setInitialPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const juzStartPage = await getPageForJuz(juzNumber);
      setInitialPage(juzStartPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load juz');
    } finally {
      setLoading(false);
    }
  }, [juzNumber]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <Text style={styles.headerTitle}>
              {strings.tabJuz} {juzNumber}
            </Text>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1A1A2E',
        }}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : initialPage !== null ? (
        <MushafReader initialPage={initialPage} />
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
    fontSize: theme.typography.body.size,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

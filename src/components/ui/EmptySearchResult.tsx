import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface EmptySearchResultProps {
  query?: string;
}

export function EmptySearchResult({ query }: EmptySearchResultProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="search-outline"
        size={48}
        color={theme.colors.textDisabled}
        style={styles.icon}
      />
      <Text style={styles.heading}>No surahs found</Text>
      <Text style={styles.body}>Try searching by surah name or number.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['3xl'],
  },
  icon: {
    marginBottom: theme.spacing.md,
  },
  heading: {
    fontSize: theme.typography.body.size,
    fontWeight: '400',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  body: {
    fontSize: theme.typography.label.size,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';

interface EmptySearchResultProps {
  query?: string;
}

export function EmptySearchResult({ query: _query }: EmptySearchResultProps) {
  const theme = useTheme();
  const strings = useStrings();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Ionicons
        name="search-outline"
        size={44}
        color={theme.semantic.fgSubtle}
        style={styles.icon}
      />
      <Text style={styles.heading}>{strings.noResults}</Text>
      <Text style={styles.body}>{strings.noResultsHint}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing['3xl'],
      alignItems: 'center',
    },
    icon: {
      marginBottom: theme.spacing.md,
    },
    heading: {
      fontFamily: theme.fonts.quran,
      fontSize: 16,
      color: theme.semantic.fg,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    body: {
      fontFamily: theme.fonts.quran,
      fontSize: 13,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
    },
  });
}

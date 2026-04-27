import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Decorative Bismillah display.
 *
 * Renders the Uthmani Bismillah text centered with paired gold dot clusters
 * above and below. Appears at the start of each surah except:
 * - Surah 1 (Al-Fatiha): Bismillah is ayah 1 itself
 * - Surah 9 (At-Tawbah): No Bismillah
 */
export function Bismillah() {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <View style={styles.dotRow}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotCenter]} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.bismillahText}>
        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
      </Text>
      <View style={styles.dotRow}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotCenter]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
      paddingHorizontal: theme.gutter.screen,
    },
    bismillahText: {
      fontFamily: theme.fonts.quran,
      fontSize: 24,
      color: theme.semantic.fg,
      textAlign: 'center',
      writingDirection: 'rtl',
      lineHeight: 24 * 1.9,
    },
    dotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: theme.spacing.xs,
      gap: 16,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.semantic.accent,
      opacity: 0.6,
    },
    dotCenter: {
      width: 6,
      height: 6,
      borderRadius: 3,
      opacity: 0.85,
    },
  });
}

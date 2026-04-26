import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SurahCartouche } from '../brand/SurahCartouche';
import type { Surah } from '../../data/types';

interface SurahHeaderBannerProps {
  surah: Surah;
}

/**
 * Sarlawh cartouche around the surah title — used only at the start of
 * a Mushaf opening page (Al-Fatiha, Al-Baqarah, etc.). The cartouche is
 * the brand's reserved ornament for surah titles; do not reuse for
 * generic headings.
 */
export function SurahHeaderBanner({ surah }: SurahHeaderBannerProps) {
  const theme = useTheme();
  const revelationLabel = surah.revelationType === 'Makki' ? 'مكية' : 'مدنية';
  const styles = createStyles(theme);

  return (
    <View style={styles.outer}>
      <View style={styles.frame}>
        <View style={styles.cartouche}>
          <SurahCartouche width={220} height={Math.round(220 * 160 / 200)} color={theme.semantic.accent} />
        </View>
        <Text style={styles.surahName}>{surah.nameArabic}</Text>
        <Text style={styles.metadata}>
          {surah.ayahCount} آية · {revelationLabel}
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    outer: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
      marginHorizontal: theme.spacing.md,
      alignItems: 'center',
    },
    frame: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
    },
    cartouche: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      opacity: 0.85,
    },
    surahName: {
      fontFamily: theme.fonts.quran,
      fontSize: theme.typeScale.heading.size,
      color: theme.semantic.fg,
      textAlign: 'center',
      marginTop: theme.spacing.xl + 4,
      marginBottom: theme.spacing.sm,
    },
    metadata: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
    },
  });
}

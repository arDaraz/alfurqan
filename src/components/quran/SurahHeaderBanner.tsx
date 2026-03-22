import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import type { Surah } from '../../data/types';

interface SurahHeaderBannerProps {
  surah: Surah;
}

/**
 * Ornamental surah header banner with gold decorative frame.
 * Shows surah name in Arabic, ayah count, and revelation type (Makki/Madani).
 */
export function SurahHeaderBanner({ surah }: SurahHeaderBannerProps) {
  const revelationLabel = surah.revelationType === 'Makki' ? 'مكية' : 'مدنية';

  return (
    <View style={styles.outerContainer}>
      <View style={styles.frame}>
        {/* Top ornamental accent line */}
        <View style={styles.accentLine} />

        <Text style={styles.surahName}>
          {surah.nameArabic}
        </Text>

        <Text style={styles.metadata}>
          {surah.ayahCount} آية • {revelationLabel}
        </Text>

        {/* Bottom ornamental accent line */}
        <View style={styles.accentLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginTop: theme.spacing['2xl'], // 48px
    marginBottom: theme.spacing['2xl'], // 48px
    marginHorizontal: theme.spacing.md, // 16px margin from edges
    alignItems: 'center',
  },
  frame: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#C9A84C', // Gold decorative border
    borderRadius: 12,
    paddingVertical: theme.spacing.lg, // 24px
    paddingHorizontal: theme.spacing.md, // 16px
    alignItems: 'center',
  },
  accentLine: {
    width: '60%',
    height: 1,
    backgroundColor: '#C9A84C', // Gold accent
    opacity: 0.5,
    marginVertical: theme.spacing.sm, // 8px
  },
  surahName: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: theme.typography.heading.size, // 24px
    fontWeight: theme.typography.heading.weight, // '700'
    color: theme.colors.text, // #1A1A2E
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: theme.spacing.sm, // 8px
  },
  metadata: {
    fontSize: theme.typography.body.size, // 18px
    color: theme.colors.textSecondary, // #6B7280
    textAlign: 'center',
  },
});

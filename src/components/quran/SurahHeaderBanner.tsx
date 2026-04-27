import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SurahCartouche } from '../brand/SurahCartouche';
import type { Surah } from '../../data/types';

interface SurahHeaderBannerProps {
  surah: Surah;
}

const BANNER_WIDTH = 320;
const BANNER_HEIGHT = 64;

/**
 * Sarlawh banner around the surah title — used at the start of a Mushaf
 * opening page (Al-Fatiha, Al-Baqarah, etc.). Dark green panel with gold
 * double border and side diamonds; the surah name renders cream/gold
 * inside the panel.
 */
export function SurahHeaderBanner({ surah }: SurahHeaderBannerProps) {
  const theme = useTheme();
  const revelationLabel = surah.revelationType === 'Makki' ? 'مكية' : 'مدنية';
  const styles = createStyles(theme);

  return (
    <View style={styles.outer}>
      <View style={styles.banner}>
        <View style={styles.bannerBg}>
          <SurahCartouche width={BANNER_WIDTH} height={BANNER_HEIGHT} />
        </View>
        <Text style={styles.surahName}>{surah.nameArabic}</Text>
      </View>
      <Text style={styles.metadata}>
        {surah.ayahCount} آية · {revelationLabel}
      </Text>
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
    banner: {
      width: BANNER_WIDTH,
      height: BANNER_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bannerBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    surahName: {
      fontFamily: theme.fonts.quran,
      fontSize: theme.typeScale.title.size,
      color: theme.semantic.fg,
      textAlign: 'center',
    },
    metadata: {
      fontFamily: theme.fonts.quran,
      fontSize: 14,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });
}

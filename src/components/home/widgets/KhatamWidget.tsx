import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStrings } from '../../../constants/strings';
import { useTheme } from '../../../hooks/useTheme';
import { useSettingsStore } from '../../../stores/settingsStore';
import { toArabicIndic } from '../../../utils/arabic';
import { NumeralText } from './NumeralText';
import { createWidgetLabelStyle, WidgetCard } from './WidgetCard';

const TOTAL_JUZ = 30;

interface Props {
  /** Furthest juz reached, 1–30. Zero means the reader has not started. */
  juzReached: number;
}

/** Khatam progress, derived from the furthest juz the reader has opened. */
export function KhatamWidget({ juzReached }: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);
  const digits = (n: number) => (isArabic ? toArabicIndic(n) : String(n));
  const clamped = Math.min(Math.max(juzReached, 0), TOTAL_JUZ);

  return (
    <WidgetCard>
      <View style={styles.header}>
        <Text style={styles.label}>{strings.widgets.khatamLabel}</Text>
        <NumeralText
          style={styles.value}
          numeralStyle={isArabic ? styles.inlineNumeral : undefined}
          numberOfLines={1}
        >
          {strings.widgets.khatamProgress(digits(clamped), digits(TOTAL_JUZ))}
        </NumeralText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(clamped / TOTAL_JUZ) * 100}%` }]} />
      </View>
    </WidgetCard>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
    },
    label: createWidgetLabelStyle(theme, isArabic),
    value: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 15 : 12,
      lineHeight: isArabic ? 22 : 16,
      color: theme.semantic.fgMuted,
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    inlineNumeral: {
      fontFamily: theme.fonts.arabicSerif,
    },
    track: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.semantic.railSurface,
      marginTop: 12,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: theme.semantic.primary,
    },
  });
}

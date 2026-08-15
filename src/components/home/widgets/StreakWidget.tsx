import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStrings } from '../../../constants/strings';
import { useTheme } from '../../../hooks/useTheme';
import { useSettingsStore } from '../../../stores/settingsStore';
import { toArabicIndic } from '../../../utils/arabic';
import { NumeralText } from './NumeralText';
import { WidgetCard } from './WidgetCard';

interface Props {
  days: number;
  longest: number;
  /** Seven booleans, oldest first, today last. */
  week: boolean[];
  style?: React.ComponentProps<typeof WidgetCard>['style'];
}

export function StreakWidget({ days, longest, week, style }: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);
  const digits = (n: number) => (isArabic ? toArabicIndic(n) : String(n));

  return (
    <WidgetCard label={strings.widgets.streakLabel} style={[styles.fill, style]}>
      <View style={styles.countRow}>
        <Text style={styles.count}>{digits(days)}</Text>
        <Text style={styles.unit}>{strings.widgets.streakDays}</Text>
      </View>
      <View style={styles.week} accessibilityLabel={strings.widgets.streakWeekAria}>
        {week.map((read, i) => (
          <View key={i} style={[styles.pip, read ? styles.pipOn : styles.pipOff]} />
        ))}
      </View>
      <NumeralText style={styles.longest} numeralStyle={isArabic ? styles.inlineNumeral : undefined}>
        {strings.widgets.streakLongest(digits(longest))}
      </NumeralText>
    </WidgetCard>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    // The design distributes the streak content over the full tile height.
    fill: {
      justifyContent: 'space-between',
    },
    countRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      marginTop: 10,
    },
    // A day count is a numeral, so it never takes the Quran font.
    count: {
      fontFamily: isArabic ? theme.fonts.arabicSerif : theme.fonts.latin,
      fontSize: 34,
      lineHeight: 38,
      fontWeight: '700',
      letterSpacing: isArabic ? 0 : -0.68,
      color: theme.semantic.primary,
    },
    unit: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 15 : 13,
      color: theme.semantic.fgMuted,
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    week: {
      flexDirection: 'row',
      gap: 5,
      marginTop: 12,
    },
    pip: {
      width: 9,
      height: 9,
    },
    pipOn: { backgroundColor: theme.semantic.primary },
    pipOff: {
      borderWidth: 1,
      borderColor: theme.palette.paper[300],
    },
    // Digits inside an Arabic sentence: Amiri, never the ayah-ornamented Quran font.
    inlineNumeral: {
      fontFamily: theme.fonts.arabicSerif,
    },
    longest: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 13 : 11,
      lineHeight: isArabic ? 20 : 14,
      color: theme.semantic.fgSubtle,
      marginTop: 10,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}

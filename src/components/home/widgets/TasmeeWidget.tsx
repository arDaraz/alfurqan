import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useStrings } from '../../../constants/strings';
import { useTheme } from '../../../hooks/useTheme';
import { useSettingsStore } from '../../../stores/settingsStore';
import { WidgetCard } from './WidgetCard';

interface Props {
  onPress: () => void;
}

/** One-tap entry into Tasmīʿ practice, for readers who start there. */
export function TasmeeWidget({ onPress }: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <WidgetCard onPress={onPress} accessibilityLabel={strings.startPractice} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconTile}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Rect x={9} y={3} width={6} height={12} rx={3} stroke={theme.semantic.primary} strokeWidth={1.75} />
            <Path
              d="M5 11a7 7 0 0 0 14 0M12 18v3"
              stroke={theme.semantic.primary}
              strokeWidth={1.75}
              strokeLinecap="round"
            />
          </Svg>
        </View>
        <Text style={styles.label}>{strings.startPractice}</Text>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d={isArabic ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}
            stroke={theme.semantic.fgSubtle}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </WidgetCard>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    card: {
      paddingVertical: 9,
    },
    row: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconTile: {
      width: 34,
      height: 34,
      borderRadius: theme.radii.sm + 2,
      backgroundColor: theme.semantic.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    label: {
      flex: 1,
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 19 : 15,
      lineHeight: isArabic ? 30 : 20,
      fontWeight: isArabic ? 'normal' : '500',
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}

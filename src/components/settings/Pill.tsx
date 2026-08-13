import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

interface Props {
  label: string;
  onPress?: () => void;
  withChevron?: boolean;
}

/**
 * Pill — small bordered button used as the trailing slot for "change" rows
 * and pill-style values (e.g., "Strict" sensitivity).
 */
export function Pill({ label, onPress, withChevron = true }: Props) {
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);
  const content = (
    <View testID={`settings-pill-${label}`} style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      {withChevron && (
        <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
          <Path
            d={isArabic ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}
            stroke={theme.semantic.fg}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={4}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    pill: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.semantic.bg,
      borderColor: theme.semantic.border,
      borderWidth: 1,
      borderRadius: theme.radii.sm + 2,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    label: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 12,
      color: theme.semantic.fg,
      fontWeight: isArabic ? 'normal' : '600',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}

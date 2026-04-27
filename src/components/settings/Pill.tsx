import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

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
  const styles = createStyles(theme);
  const content = (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      {withChevron && (
        <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
          <Path d="m15 6-6 6 6 6" stroke={theme.semantic.fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    pill: {
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
      fontFamily: theme.fonts.quran,
      fontSize: 12,
      color: theme.semantic.fg,
      writingDirection: 'rtl',
    },
  });
}

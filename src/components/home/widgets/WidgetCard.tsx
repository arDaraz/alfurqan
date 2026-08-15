import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../../hooks/useTheme';
import { useSettingsStore } from '../../../stores/settingsStore';

interface Props {
  /** Overline label. Omit for a widget that carries its own header row. */
  label?: string;
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared widget shell: raised paper, hairline border, no shadow. Every home
 * widget sits in one so the surface reads as one material.
 */
export function WidgetCard({ label, children, onPress, accessibilityLabel, style }: Props) {
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const body = (
    <>
      {label !== undefined && <Text style={styles.label}>{label}</Text>}
      {children}
    </>
  );

  if (!onPress) return <View style={[styles.card, style]}>{body}</View>;

  // A function-form `style` does not apply on Pressable in this RN version, so
  // the resolved array is passed directly.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.card, style]}
    >
      {body}
    </Pressable>
  );
}

export function createWidgetLabelStyle(
  theme: ReturnType<typeof useTheme>,
  isArabic: boolean
): TextStyle {
  return {
    fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
    fontSize: isArabic ? 15 : 10,
    lineHeight: isArabic ? 22 : 13,
    letterSpacing: isArabic ? 0 : 1.8,
    fontWeight: isArabic ? 'normal' : '700',
    textTransform: isArabic ? 'none' : 'uppercase',
    color: theme.semantic.fgSubtle,
    textAlign: 'left',
    writingDirection: isArabic ? 'rtl' : 'ltr',
  };
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    card: {
      direction: isArabic ? 'rtl' : 'ltr',
      backgroundColor: theme.semantic.widgetSurface,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      borderRadius: theme.radii.md,
      padding: 14,
    },
    label: createWidgetLabelStyle(theme, isArabic),
  });
}

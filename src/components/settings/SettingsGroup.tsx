import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

interface Props {
  label: string;
  children: React.ReactNode;
}

export function SettingsGroup({ label, children }: Props) {
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    label: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 14 : 10,
      letterSpacing: isArabic ? 0 : 2.2,
      color: theme.semantic.accent,
      textTransform: isArabic ? 'none' : 'uppercase',
      fontWeight: isArabic ? 'normal' : '700',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      marginHorizontal: 6,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    group: {
      backgroundColor: theme.semantic.bgRaised,
      borderRadius: theme.radii.md + 2,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      overflow: 'hidden',
    },
  });
}

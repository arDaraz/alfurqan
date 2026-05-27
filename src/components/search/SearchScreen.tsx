import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

export function SearchScreen() {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{strings.tabSearch}</Text>
      </View>
      <View style={styles.hintWrap}>
        <Text style={styles.hint}>{strings.searchHint}</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
      direction: isArabic ? 'rtl' : 'ltr',
    },
    header: {
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: theme.typeScale.heading.size,
      lineHeight: theme.typeScale.heading.size * theme.typeScale.heading.lineHeight,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    hintWrap: {
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.xl,
      alignItems: 'center',
    },
    hint: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.size * theme.typeScale.body.lineHeight,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
    },
  });
}

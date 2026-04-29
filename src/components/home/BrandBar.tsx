import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LogoGlyph } from '../brand/LogoGlyph';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';

/**
 * Top-of-Home brand bar: rosette glyph + localized wordmark.
 */
export function BrandBar() {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <LogoGlyph size={36} bg={theme.semantic.primary} gold={theme.semantic.accentSoft} goldSoft={theme.semantic.accentSoft} />
        <View style={styles.wordmarkText}>
          <Text style={styles.brandTitle}>{strings.appTitle}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    row: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    brand: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    wordmarkText: {
      alignItems: isArabic ? 'flex-end' : 'flex-start',
      height: 36,
      justifyContent: 'center',
    },
    brandTitle: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 20 : 18,
      color: theme.semantic.fg,
      lineHeight: 36,
      textAlign: isArabic ? 'right' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      fontWeight: isArabic ? 'normal' : '700',
      includeFontPadding: false,
    },
  });
}

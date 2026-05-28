import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { LogoGlyph } from '../brand/LogoGlyph';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';

/**
 * Top-of-Home brand bar: rosette glyph + localized wordmark and a trailing
 * action slot. Currently hosts the bookmarks entry icon.
 */
export function BrandBar() {
  const theme = useTheme();
  const strings = useStrings();
  const router = useRouter();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <LogoGlyph
          size={36}
          bg={theme.semantic.primary}
          gold={theme.semantic.accentSoft}
          goldSoft={theme.semantic.accentSoft}
        />
        <View style={styles.wordmarkText}>
          <Text style={styles.brandTitle}>{strings.appTitle}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.bookmarks.openLabel}
        onPress={() => router.push('/bookmarks' as never)}
        hitSlop={6}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
      >
        <Svg width={18} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            stroke={theme.semantic.accent}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    row: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: theme.radii.md,
      backgroundColor: theme.semantic.bgRaised,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPressed: { opacity: 0.7 },
  });
}

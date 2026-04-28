import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LogoGlyph } from '../brand/LogoGlyph';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';

interface Props {
  /** Avatar initial — first character of the user's name. */
  avatarInitial?: string;
}

/**
 * Top-of-Home brand bar: rosette glyph + الفرقان wordmark + avatar.
 * Brand sits at the start (right edge in RTL); avatar pushes to the end.
 */
export function BrandBar({ avatarInitial = 'أ' }: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <LogoGlyph size={36} bg={theme.semantic.primary} gold={theme.semantic.accentSoft} goldSoft={theme.semantic.accentSoft} />
        <View style={styles.wordmarkText}>
          <Text style={styles.brandArabic}>{strings.appTitle}</Text>
          <Text style={styles.brandRoman}>{strings.appWordmarkRoman}</Text>
        </View>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarInitial}</Text>
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
    },
    brandArabic: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 20,
      color: theme.semantic.fg,
      lineHeight: 22,
      textAlign: isArabic ? 'right' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      fontWeight: isArabic ? 'normal' : '700',
    },
    brandRoman: {
      fontFamily: theme.fonts.latin,
      fontSize: 9,
      letterSpacing: 2.7,
      fontWeight: '700',
      color: theme.semantic.fgMuted,
      marginTop: 3,
      writingDirection: 'ltr',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: theme.semantic.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 16,
      color: theme.semantic.fgOnPrimary,
    },
  });
}

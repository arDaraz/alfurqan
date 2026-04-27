import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LogoGlyph } from '../brand/LogoGlyph';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';

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
  const styles = createStyles(theme);

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

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    wordmarkText: {
      // Logical start in RTL = right edge of the stack (next to the brand mark).
      alignItems: 'flex-start',
    },
    brandArabic: {
      fontFamily: theme.fonts.quran,
      fontSize: 20,
      color: theme.semantic.fg,
      lineHeight: 22,
      textAlign: 'left',
      writingDirection: 'rtl',
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

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { OrnamentDivider } from '../brand/OrnamentDivider';
import type { AyahActionType, AyahSelection } from '../../data/types';

interface MushafReaderProps {
  initialPage: number;
  onPageChange?: (pageNumber: number) => void;
  onAyahAction?: (action: AyahActionType, selection: AyahSelection) => void;
}

/**
 * Web fallback for the Mushaf reader. The native version uses
 * `react-native-pager-view` + a WebView mushaf renderer, neither of which
 * supports web. We show a placeholder so design verification on `expo
 * start --web` still loads the chrome (header/toolbar) for review.
 */
export function MushafReader({ initialPage }: MushafReaderProps) {
  const theme = useTheme();
  const strings = useStrings();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <OrnamentDivider tier="medium" color={theme.semantic.accent} darkMode={theme.mode === 'dark'} />
        <Text style={styles.title}>المصحف · Mushaf reader</Text>
        <Text style={styles.body}>
          {strings.mushafPageIndicator(initialPage)}
        </Text>
        <Text style={styles.caption}>
          The page-by-page Mushaf renderer is native-only (uses PagerView +
          WebView). On the web build the surrounding chrome is shown for
          design review.
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.gutter.screen,
    },
    title: {
      fontFamily: theme.fonts.arabic,
      fontSize: theme.typeScale.heading.size,
      lineHeight: theme.typeScale.heading.size * theme.typeScale.heading.lineHeight,
      color: theme.semantic.fg,
      textAlign: 'center',
    },
    body: {
      fontFamily: theme.fonts.arabic,
      fontSize: 13,
      letterSpacing: 1.32,
      color: theme.semantic.accent,
      textAlign: 'center',
      fontWeight: '700',
    },
    caption: {
      fontFamily: theme.fonts.latin,
      fontSize: 12,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
      maxWidth: 320,
      lineHeight: 18,
    },
  });
}

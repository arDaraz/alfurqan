import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStrings } from '../../constants/strings';
import { useReaderColors, type ReaderColors } from '../../hooks/useReaderColors';
import { OrnamentDivider } from '../brand/OrnamentDivider';
import type { Theme } from '../../constants/theme';

interface PageIndicatorProps {
  currentPage: number;
}

/**
 * Folio ornament + page label. Sits at the bottom of the mushaf page below
 * the toolbar height so it doesn't compete with the primary actions.
 */
export function PageIndicator({ currentPage }: PageIndicatorProps) {
  const strings = useStrings();
  const { theme, colors, nightReadingEnabled } = useReaderColors();
  const styles = createStyles(theme, colors);

  return (
    <View style={styles.container}>
      <OrnamentDivider
        tier="compact"
        color={colors.accent}
        darkMode={nightReadingEnabled || theme.mode === 'dark'}
      />
      <Text style={styles.text}>{strings.mushafPageIndicator(currentPage)}</Text>
    </View>
  );
}

function createStyles(theme: Theme, colors: ReaderColors) {
  return StyleSheet.create({
    container: {
      paddingVertical: theme.spacing.sm,
      backgroundColor: 'transparent',
      alignItems: 'center',
      gap: 4,
    },
    text: {
      fontFamily: theme.fonts.arabic,
      fontSize: 11,
      letterSpacing: 0.66,
      fontWeight: '600',
      color: colors.accent,
    },
  });
}

import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { toArabicIndic } from '../../utils/arabic';
import { theme } from '../../constants/theme';
import type { Ayah } from '../../data/types';

export type AyahSelectionState = 'default' | 'selected-start' | 'selected-end' | 'in-range';

interface AyahTextProps {
  ayah: Ayah;
  selectionState: AyahSelectionState;
  onPress: (ayahNumber: number) => void;
}

/**
 * Renders a single ayah with Uthmani Arabic text, inline end marker,
 * RTL writing direction, and selection state visual feedback.
 */
export function AyahText({ ayah, selectionState, onPress }: AyahTextProps) {
  const handlePress = useCallback(() => {
    onPress(ayah.ayahNumber);
  }, [ayah.ayahNumber, onPress]);

  const containerStyle = useMemo((): ViewStyle => {
    switch (selectionState) {
      case 'selected-start':
      case 'selected-end':
        return {
          backgroundColor: '#0D737720',
          borderLeftWidth: 2,
          borderLeftColor: theme.colors.primary,
        };
      case 'in-range':
        return {
          backgroundColor: '#0D737720',
        };
      default:
        return {};
    }
  }, [selectionState]);

  const markerColor = useMemo(() => {
    return selectionState !== 'default' ? theme.colors.primary : theme.colors.accent;
  }, [selectionState]);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, containerStyle]}
      accessibilityLabel={`Ayah ${ayah.ayahNumber}: ${ayah.textUthmani}`}
      accessibilityRole="button"
    >
      <Text style={styles.ayahText}>
        {ayah.textUthmani}{' '}
        <Text style={[styles.endMarker, { color: markerColor }]}>
          {'\u06DD'}{toArabicIndic(ayah.ayahNumber)}
        </Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.xl, // 32px
    paddingVertical: 6, // 12px gap between ayahs / 2
    writingDirection: 'rtl',
  },
  ayahText: {
    fontFamily: theme.fonts.arabic,
    fontSize: theme.typography.display.size, // 28
    fontWeight: theme.typography.display.weight, // '700'
    lineHeight: theme.typography.display.size * theme.typography.display.arabicLineHeight, // 28 * 2.2 = 61.6
    color: theme.colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  endMarker: {
    fontSize: theme.typography.label.size, // 14px
    color: theme.colors.accent, // #C9A84C gold
  },
});

import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, StyleSheet, View, type ViewStyle } from 'react-native';
import { toArabicIndic } from '../../utils/arabic';
import { useTheme } from '../../hooks/useTheme';
import { AyahRosette } from '../brand/AyahRosette';
import type { Ayah } from '../../data/types';

export type AyahSelectionState = 'default' | 'selected-start' | 'selected-end' | 'in-range';

interface AyahTextProps {
  ayah: Ayah;
  selectionState: AyahSelectionState;
  onPress: (ayahNumber: number) => void;
}

/**
 * Single-ayah block — Uthmani text + ornamental gold rosette + small Arabic
 * numeral. Selection state inset-shadows the row instead of brightening it.
 */
export function AyahText({ ayah, selectionState, onPress }: AyahTextProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const handlePress = useCallback(() => onPress(ayah.ayahNumber), [ayah.ayahNumber, onPress]);

  const containerStyle = useMemo((): ViewStyle => {
    const isSelected =
      selectionState === 'selected-start' ||
      selectionState === 'selected-end' ||
      selectionState === 'in-range';
    return isSelected
      ? {
          backgroundColor: theme.semantic.selectedRange,
          borderWidth: 1,
          borderColor: theme.semantic.primaryFocusRing,
        }
      : {};
  }, [selectionState, theme]);

  const rosetteColor =
    selectionState === 'default' ? theme.semantic.accent : theme.semantic.primary;

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, containerStyle]}
      accessibilityLabel={`Ayah ${ayah.ayahNumber}: ${ayah.textUthmani}`}
      accessibilityRole="button"
    >
      <Text style={styles.ayahText}>
        {ayah.textUthmani}{' '}
        <View style={styles.rosetteWrap}>
          <AyahRosette size={20} color={rosetteColor} />
          <Text style={styles.rosetteNumber}>{toArabicIndic(ayah.ayahNumber)}</Text>
        </View>
      </Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: theme.gutter.ayah,
      paddingVertical: 6,
      borderRadius: theme.radii.sm,
      writingDirection: 'rtl',
    },
    ayahText: {
      fontFamily: theme.fonts.quran,
      fontSize: theme.typeScale.quranSm.size,
      lineHeight: theme.typeScale.quranSm.size * theme.typeScale.quranSm.lineHeight,
      color: theme.semantic.fg,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    rosetteWrap: {
      width: 20,
      height: 20,
    },
    rosetteNumber: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 20,
      height: 20,
      textAlign: 'center',
      fontFamily: theme.fonts.latin,
      fontSize: 8,
      color: theme.semantic.accent,
      fontWeight: '700',
      lineHeight: 20,
    },
  });
}

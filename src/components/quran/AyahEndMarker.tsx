import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { toArabicIndic } from '../../utils/arabic';
import { useTheme } from '../../hooks/useTheme';
import { AyahRosette, type AyahRosetteVariant } from '../brand/AyahRosette';

const VARIANT_SIZE = { ayah: 32, inline: 24, compact: 18 } as const;
const VARIANT_FONT = { ayah: 11, inline: 9, compact: 7 } as const;

interface AyahEndMarkerProps {
  ayahNumber: number;
  variant?: AyahRosetteVariant;
  isSelected?: boolean;
}

export function AyahEndMarker({ ayahNumber, variant = 'inline', isSelected = false }: AyahEndMarkerProps) {
  const theme = useTheme();
  const color = isSelected ? theme.semantic.primary : theme.semantic.accent;
  const size = VARIANT_SIZE[variant];
  const fontSize = VARIANT_FONT[variant];

  return (
    <View style={{ width: size, height: size }}>
      <AyahRosette variant={variant} color={color} />
      <Text style={[styles.number, { color, width: size, height: size, lineHeight: size, fontSize }]}>
        {toArabicIndic(ayahNumber)}
      </Text>
    </View>
  );
}

export function renderAyahEndMarker(ayahNumber: number): string {
  return `۝${toArabicIndic(ayahNumber)}`;
}

const styles = StyleSheet.create({
  number: {
    position: 'absolute',
    top: 0,
    left: 0,
    textAlign: 'center',
    fontFamily: 'Manrope',
    fontWeight: '700',
  },
});

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { toArabicIndic } from '../../utils/arabic';
import { theme } from '../../constants/theme';

interface AyahEndMarkerProps {
  ayahNumber: number;
  isSelected?: boolean;
}

/**
 * Renders the ornamental end-of-ayah symbol inline.
 * Uses Unicode U+06DD (۝) followed by Arabic-Indic numeral.
 */
export function AyahEndMarker({ ayahNumber, isSelected = false }: AyahEndMarkerProps) {
  return (
    <Text
      style={[
        styles.marker,
        { color: isSelected ? theme.colors.primary : theme.colors.accent },
      ]}
    >
      {renderAyahEndMarker(ayahNumber, isSelected)}
    </Text>
  );
}

/**
 * Returns the inline end-of-ayah marker string for use inside Text components.
 * Format: ۝ followed by Arabic-Indic numeral of the ayah number.
 */
export function renderAyahEndMarker(ayahNumber: number, _isSelected: boolean = false): string {
  return `\u06DD${toArabicIndic(ayahNumber)}`;
}

const styles = StyleSheet.create({
  marker: {
    fontSize: theme.typography.label.size,
  },
});

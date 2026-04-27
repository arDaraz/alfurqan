import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import {
  getNightReadingPalette,
  NIGHT_READING_MODES,
  type ActiveNightReadingMode,
} from '../../constants/nightReading';

type ModeCopy = Record<ActiveNightReadingMode, { title: string; subtitle: string }>;

interface Props {
  value: ActiveNightReadingMode;
  labels: ModeCopy;
  isArabic: boolean;
  onChange: (mode: ActiveNightReadingMode) => void;
}

export function NightReadingPicker({ value, labels, isArabic, onChange }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme, isArabic);
  const selectedPalette = getNightReadingPalette(value);
  const selectedLabel = labels[value];

  return (
    <View style={styles.container}>
      <View style={styles.circleRow}>
        {NIGHT_READING_MODES.map(({ id }) => {
          const palette = getNightReadingPalette(id);
          const selected = value === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={labels[id].title}
              accessibilityHint={labels[id].subtitle}
              onPress={() => onChange(id)}
              style={({ pressed }) => [
                styles.circleButton,
                selected && styles.circleButtonSelected,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: palette.background,
                    borderColor: selected ? palette.accent : theme.semantic.borderStrong,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View
        style={[
          styles.details,
          {
            backgroundColor: selectedPalette.surface,
            borderColor: selectedPalette.accent,
          },
        ]}
      >
        <Text
          style={[styles.title, { color: selectedPalette.foreground }]}
          numberOfLines={1}
        >
          {selectedLabel.title}
        </Text>
        <Text
          style={[styles.subtitle, { color: selectedPalette.muted }]}
          numberOfLines={2}
        >
          {selectedLabel.subtitle}
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.semantic.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 12,
    },
    circleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      gap: 12,
    },
    circleButton: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleButtonSelected: {
      backgroundColor: theme.semantic.bgSunken,
    },
    circle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
    },
    pressed: {
      opacity: 0.82,
    },
    details: {
      borderWidth: 1,
      borderRadius: theme.radii.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 3,
    },
    title: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 16 : 13,
      fontWeight: isArabic ? 'normal' : '700',
      color: theme.semantic.fg,
      writingDirection: isArabic ? 'rtl' : 'ltr',
      textAlign: 'left',
    },
    subtitle: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 12 : 11,
      lineHeight: isArabic ? 18 : 15,
      color: theme.semantic.fgMuted,
      writingDirection: isArabic ? 'rtl' : 'ltr',
      textAlign: 'left',
    },
  });
}

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Juz } from '../../data/types';
import { toArabicIndic } from '../../utils/arabic';
import { theme } from '../../constants/theme';

interface JuzListItemProps {
  juz: Juz;
  surahNames: Map<number, string>;
  onPress: (juzNumber: number) => void;
}

export function JuzListItem({ juz, surahNames, onPress }: JuzListItemProps) {
  const arabicNumber = toArabicIndic(juz.number);
  const surahName = surahNames.get(juz.startSurah) || '';

  return (
    <Pressable
      onPress={() => onPress(juz.number)}
      accessibilityLabel={`Juz ${juz.number}, starts at Surah ${surahName}, Ayah ${juz.startAyah}`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Left: Juz number in circle */}
      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          <Text style={styles.circleText}>{arabicNumber}</Text>
        </View>
      </View>

      {/* Center: Juz heading + start position */}
      <View style={styles.centerContent}>
        <Text style={styles.heading}>Juz {arabicNumber}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          Starts at Surah {surahName}, Ayah {juz.startAyah}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    marginLeft: theme.spacing.md,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: `${theme.colors.divider}40`,
  },
  circleContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C9A84C',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  circleText: {
    fontSize: theme.typography.label.size,
    fontWeight: '400',
    color: theme.colors.text,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: theme.typography.body.size,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: theme.typography.label.size,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
});

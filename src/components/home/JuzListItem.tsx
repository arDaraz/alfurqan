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
      accessibilityLabel={`الجزء ${juz.number}`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Circle with number */}
      <View style={styles.circle}>
        <Text style={styles.circleText}>{arabicNumber}</Text>
      </View>

      {/* Juz info */}
      <View style={styles.textContent}>
        <Text style={styles.heading}>الجزء {arabicNumber}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          يبدأ من سورة {surahName}، الآية {toArabicIndic(juz.startAyah)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: `${theme.colors.divider}40`,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C9A84C',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  circleText: {
    fontSize: 13,
    color: theme.colors.text,
    textAlign: 'center',
  },
  textContent: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: theme.spacing.sm,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    writingDirection: 'rtl',
  },
});

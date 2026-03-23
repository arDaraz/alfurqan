import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Surah } from '../../data/types';
import { theme } from '../../constants/theme';
import { useStrings } from '../../constants/strings';

interface SurahListItemProps {
  surah: Surah;
  onPress: (surahNumber: number) => void;
  isActive?: boolean;
}

export function SurahListItem({ surah, onPress, isActive = false }: SurahListItemProps) {
  const strings = useStrings();

  return (
    <Pressable
      onPress={() => onPress(surah.number)}
      accessibilityLabel={surah.nameArabic}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Right: Surah name + metadata */}
      <View style={styles.nameContent}>
        <Text
          style={[styles.arabicName, isActive && styles.arabicNameActive]}
          numberOfLines={1}
        >
          {surah.nameArabic}
        </Text>
        <Text style={styles.metadata}>
          {surah.ayahCount} {strings.ayat} · {surah.revelationType === 'Makki' ? strings.makki : strings.madani}
        </Text>
      </View>

      {/* Left: Diamond with surah number */}
      <View style={styles.diamondContainer}>
        <View style={styles.diamond}>
          <Text style={styles.diamondText}>{surah.number}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: `${theme.colors.divider}40`,
  },
  diamondContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  diamond: {
    width: 32,
    height: 32,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: '#C9A84C',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  diamondText: {
    transform: [{ rotate: '-45deg' }],
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.text,
    textAlign: 'center',
  },
  nameContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: theme.spacing.sm,
  },
  arabicName: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'KFGQPC-Uthmani',
    color: theme.colors.text,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  arabicNameActive: {
    color: theme.colors.primary,
  },
  metadata: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    writingDirection: 'rtl',
  },
});

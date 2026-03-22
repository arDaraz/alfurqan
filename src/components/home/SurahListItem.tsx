import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Surah } from '../../data/types';
import { theme } from '../../constants/theme';

interface SurahListItemProps {
  surah: Surah;
  onPress: (surahNumber: number) => void;
  isActive?: boolean;
}

export function SurahListItem({ surah, onPress, isActive = false }: SurahListItemProps) {
  return (
    <Pressable
      onPress={() => onPress(surah.number)}
      accessibilityLabel={`Surah ${surah.nameEnglish}, ${surah.ayahCount} ayahs, ${surah.revelationType}`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Left: Diamond with surah number */}
      <View style={styles.diamondContainer}>
        <View style={styles.diamond}>
          <Text style={styles.diamondText}>{surah.number}</Text>
        </View>
      </View>

      {/* Center: Arabic name + English name */}
      <View style={styles.centerContent}>
        <Text
          style={[
            styles.arabicName,
            isActive && styles.arabicNameActive,
          ]}
          numberOfLines={1}
        >
          {surah.nameArabic}
        </Text>
        <Text style={styles.englishName} numberOfLines={1}>
          {surah.nameEnglish}
        </Text>
      </View>

      {/* Right: Ayah count + revelation type */}
      <View style={styles.rightContent}>
        <Text style={styles.metadata}>{surah.ayahCount} ayat</Text>
        <Text style={styles.metadata}>{surah.revelationType}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
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
  diamondContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  diamond: {
    width: 36,
    height: 36,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: '#C9A84C',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  diamondText: {
    transform: [{ rotate: '-45deg' }],
    fontSize: theme.typography.label.size,
    fontWeight: '400',
    color: theme.colors.text,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  arabicName: {
    fontSize: theme.typography.heading.size,
    fontWeight: theme.typography.heading.weight,
    fontFamily: 'KFGQPC-Uthmani',
    color: theme.colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 2,
  },
  arabicNameActive: {
    color: theme.colors.primary,
  },
  englishName: {
    fontSize: theme.typography.label.size,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    textAlign: 'left',
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 60,
  },
  metadata: {
    fontSize: theme.typography.label.size,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
});

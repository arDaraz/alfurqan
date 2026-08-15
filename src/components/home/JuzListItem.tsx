import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Juz } from '../../data/types';
import { toArabicIndic } from '../../utils/arabic';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { KhatamStar } from '../brand/KhatamStar';

interface JuzListItemProps {
  juz: Juz;
  surahNames: Map<number, string>;
  onSelect: (juzNumber: number) => void;
  onOpen: (juzNumber: number) => void;
  isActive?: boolean;
}

export function JuzListItem({ juz, surahNames, onSelect, onOpen, isActive = false }: JuzListItemProps) {
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const displayNumber = isArabic ? toArabicIndic(juz.number) : String(juz.number);
  const ayahNumber = isArabic ? toArabicIndic(juz.startAyah) : String(juz.startAyah);
  const surahName = surahNames.get(juz.startSurah) || '';
  const styles = createStyles(theme, isArabic);
  const title = isArabic ? 'الجزء' : `Juz ${juz.number}`;
  const subtitle = isArabic
    ? `يبدأ من سورة ${surahName} الآية ${toArabicIndic(juz.startAyah)}`
    : `Starts at Surah ${surahName}, Ayah ${juz.startAyah}`;
  const accessibilityLabel = isArabic ? `الجزء ${juz.number}` : `Juz ${juz.number}`;

  // A row is a button: one tap marks it active and opens the juz reader.
  const handlePress = () => {
    onSelect(juz.number);
    onOpen(juz.number);
  };

  const strokeColor = isActive ? theme.semantic.primary : theme.semantic.accent;
  const fillColor = theme.semantic.bg;
  const numberColor = isActive ? theme.semantic.primary : theme.semantic.accent;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={[styles.container, isActive && styles.activeContainer]}
    >
      {isActive && <View style={styles.activeBar} />}

      <View style={styles.badge}>
        <KhatamStar size={44} color={strokeColor} fill={fillColor} strokeWidth={1} />
        <Text style={[styles.badgeNumber, { color: numberColor }]}>{displayNumber}</Text>
      </View>

      <View style={styles.textContent}>
        <Text style={[styles.heading, isActive && styles.headingActive]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {isArabic ? (
            <>
              يبدأ من سورة {surahName} الآية <Text style={styles.ayahNum}>{ayahNumber}</Text>
            </>
          ) : (
            subtitle
          )}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginHorizontal: 10,
      marginVertical: 2,
      borderRadius: theme.radii.md,
      position: 'relative',
    },
    activeContainer: {
      backgroundColor: theme.semantic.primaryTint,
    },
    activeBar: {
      position: 'absolute',
      top: 6,
      bottom: 6,
      ...(isArabic ? { right: 0 } : { left: 0 }),
      width: 3,
      borderRadius: 2,
      backgroundColor: theme.semantic.primary,
    },
    badge: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    badgeNumber: {
      position: 'absolute',
      fontFamily: theme.fonts.latin,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    textContent: {
      flex: 1,
      justifyContent: 'center',
    },
    heading: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 19 : 16,
      fontWeight: isArabic ? 'normal' : '600',
      color: theme.semantic.fg,
      lineHeight: 24,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    headingActive: {
      color: theme.semantic.primary,
    },
    subtitle: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 15 : 12,
      color: theme.semantic.fgMuted,
      marginTop: isArabic ? 8 : 4,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      lineHeight: isArabic ? 28 : 18,
    },
    ayahNum: {
      fontSize: 22,
      lineHeight: 28,
      textAlignVertical: 'center',
    },
  });
}

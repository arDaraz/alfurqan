import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Surah } from '../../data/types';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { KhatamStar } from '../brand/KhatamStar';
import { toArabicIndic } from '../../utils/arabic';
import { surahMeanings } from '../../data/surahMeanings';

interface SurahListItemProps {
  surah: Surah;
  onSelect: (surahNumber: number) => void;
  onOpen: (surahNumber: number) => void;
  isActive?: boolean;
}

/**
 * Surah row matching the v2 design-system "List rows · A · Rosette" variant:
 *   [ AYAT count + label ]   [ English meta · Arabic name ]   [ filled rosette + number ]
 *                                                                  ↑ start (right in RTL)
 *
 * Active rows take a soft primary tint with a vertical primary bar at the start
 * edge. The rosette is the filled khātam with a 1-px gold/primary stroke and
 * the surah number rendered in cream/gold inside.
 */
export function SurahListItem({ surah, onSelect, onOpen, isActive = false }: SurahListItemProps) {
  const theme = useTheme();
  const strings = useStrings();
  const language = useSettingsStore((s) => s.language);
  const isArabic = language === 'ar';
  const styles = createStyles(theme, isArabic);
  const meaning = surahMeanings[surah.number];
  const revelation = surah.revelationType === 'Makki' ? strings.makki : strings.madani;

  const primaryName = isArabic ? surah.nameArabic : surah.nameEnglish;
  const secondaryMeta = isArabic
    ? revelation
    : meaning
      ? `${meaning} · ${revelation}`
      : revelation;

  const ayatNumber = isArabic ? toArabicIndic(surah.ayahCount) : String(surah.ayahCount);
  const ayatLabel = strings.ayat;

  const lastTapRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      lastTapRef.current = 0;
      onOpen(surah.number);
    } else {
      lastTapRef.current = now;
      tapTimerRef.current = setTimeout(() => {
        onSelect(surah.number);
        lastTapRef.current = 0;
      }, 300);
    }
  };

  const strokeColor = isActive ? theme.semantic.primary : theme.semantic.accent;
  const fillColor = theme.semantic.bg;
  const numberColor = isActive ? theme.semantic.primary : theme.semantic.accent;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={() => onOpen(surah.number)}
      delayLongPress={400}
      accessibilityLabel={isArabic ? surah.nameArabic : surah.nameEnglish}
      accessibilityRole="button"
      style={[styles.container, isActive && styles.activeContainer]}
    >
      {isActive && <View style={styles.activeBar} />}

      <View style={styles.badge}>
        <KhatamStar size={44} color={strokeColor} fill={fillColor} strokeWidth={1} />
        <Text style={[styles.badgeNumber, { color: numberColor }]}>{surah.number}</Text>
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.primaryName, isActive && styles.primaryNameActive]} numberOfLines={1}>
          {primaryName}
        </Text>
        <Text style={[styles.metadata, isArabic && styles.metadataArabic]} numberOfLines={1}>
          {secondaryMeta}
        </Text>
      </View>

      <View style={styles.ayatBlock}>
        <Text style={styles.ayatNumber}>{ayatNumber}</Text>
        <Text style={styles.ayatLabel}>{ayatLabel}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    pressed: {
      opacity: 0.7,
    },

    // Trailing column (visual left in RTL): big ayah count + "AYAT"/"آية" label.
    ayatBlock: {
      width: 56,
      alignItems: 'center',
    },
    ayatNumber: {
      fontFamily: theme.fonts.latin,
      fontSize: 18,
      fontWeight: '600',
      color: theme.semantic.fg,
      lineHeight: 22,
    },
    ayatLabel: {
      fontFamily: theme.fonts.latin,
      fontSize: 9,
      fontWeight: '700',
      color: theme.semantic.fgSubtle,
      letterSpacing: 1.2,
      marginTop: 2,
    },

    // Middle stack: locale primary name on top, locale metadata below.
    textBlock: {
      flex: 1,
    },
    primaryName: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 19 : 16,
      fontWeight: isArabic ? 'normal' : '600',
      color: theme.semantic.fg,
      lineHeight: 28,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    primaryNameActive: {
      color: theme.semantic.primary,
    },
    metadata: {
      fontFamily: theme.fonts.latin,
      fontSize: 12,
      color: theme.semantic.fgMuted,
      marginTop: 4,
      letterSpacing: 0.2,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: 'ltr',
    },
    metadataArabic: {
      fontFamily: theme.fonts.quran,
      fontSize: 13,
      letterSpacing: 0,
      textAlign: 'left',
      writingDirection: 'rtl',
    },

    // Leading column (visual right in RTL): filled rosette badge with number.
    badge: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeNumber: {
      position: 'absolute',
      fontFamily: theme.fonts.latin,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}

import React, { useEffect, useRef, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import { formatRelativeBucket } from '../../utils/formatRelativeTime';
import { getAyahPreview } from '../../data/quranRepository';
import type { BookmarkCategory } from '../../data/types';

interface Props {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  pageNumber: number;
  juzNumber: number;
  category: BookmarkCategory;
  createdAt: number;
  onPress: () => void;
  onDelete: () => void;
}

export function BookmarkRow({
  surahNumber,
  ayahNumber,
  surahName,
  pageNumber,
  juzNumber,
  category,
  createdAt,
  onPress,
  onDelete,
}: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const language = useSettingsStore((s) => s.language);
  const isArabic = language === 'ar';
  const styles = createStyles(theme, isArabic);

  const [preview, setPreview] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void getAyahPreview(surahNumber, ayahNumber, 180).then((text) => {
      if (mounted.current) setPreview(text);
    });
    return () => {
      mounted.current = false;
    };
  }, [surahNumber, ayahNumber]);

  const ayahLabel = isArabic ? toArabicIndic(ayahNumber) : String(ayahNumber);
  const pageLabel = isArabic ? toArabicIndic(pageNumber) : String(pageNumber);
  const juzLabel = isArabic ? toArabicIndic(juzNumber) : String(juzNumber);
  const timeLabel = formatRelativeBucket(createdAt, isArabic ? 'ar' : 'en');
  const badgeLabel =
    category === 'recitation'
      ? strings.bookmarks.categoryBadgeRecitation
      : strings.bookmarks.categoryBadgeReading;
  const pageWord = isArabic ? 'ص' : 'P';
  const juzWord = isArabic ? 'جزء' : 'Juz';

  const renderDeleteAction = () => (
    <RectButton
      accessibilityLabel={`delete-${surahNumber}-${ayahNumber}`}
      onPress={onDelete}
      style={styles.deleteAction}
    >
      <Text style={styles.deleteText}>{strings.bookmarks.deleteAction}</Text>
    </RectButton>
  );

  const actionProps = I18nManager.isRTL
    ? { renderLeftActions: renderDeleteAction, overshootLeft: false }
    : { renderRightActions: renderDeleteAction, overshootRight: false };

  return (
    <Swipeable
      {...actionProps}
      containerStyle={{
        marginHorizontal: theme.gutter.screen,
        marginBottom: theme.spacing.md + 4,
        backgroundColor: '#FCF7E5',
        borderRadius: theme.radii.lg,
        shadowColor: '#0E2724',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.32,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`bookmark-row-${surahNumber}-${ayahNumber}`}
        onPress={onPress}
        style={{
          paddingVertical: theme.spacing.lg + 2,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.md,
          borderRadius: theme.radii.lg,
        }}
      >
        <View style={[styles.accentBar, isArabic ? styles.accentBarStart : styles.accentBarStartLtr]} />
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.surahName} numberOfLines={1}>
              {surahName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{strings.searchAyahLabel}</Text>
              <Text style={styles.metaNum}>{ayahLabel}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaLabel}>{pageWord}</Text>
              <Text style={styles.metaNum}>{pageLabel}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaLabel}>{juzWord}</Text>
              <Text style={styles.metaNum}>{juzLabel}</Text>
            </View>
          </View>
          <View style={styles.badge}>
            <BookIcon color={theme.semantic.accent} size={13} />
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        </View>

        <Text style={styles.preview} numberOfLines={3}>
          {preview}
        </Text>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View style={styles.timeWrap}>
            <ClockIcon color={theme.semantic.accent} size={13} />
            <Text style={styles.timeText} numberOfLines={1}>
              {timeLabel}
            </Text>
          </View>
          <View style={styles.openCta}>
            <Text style={styles.openText}>{strings.bookmarks.openCta}</Text>
            <Chevron color={theme.semantic.fgOnPrimary} size={12} />
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}

function BookIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.5.5H6a2 2 0 0 1-2-2V5.5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.6} />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Chevron({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m15 6-6 6 6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    accentBar: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: theme.semantic.accent,
    },
    // Match the card corner radius so the bar tucks under the rounded edge
    // instead of extending past it (no overflow: hidden on the card).
    accentBarStart: {
      right: 0,
      borderTopRightRadius: theme.radii.lg,
      borderBottomRightRadius: theme.radii.lg,
    },
    accentBarStartLtr: {
      left: 0,
      borderTopLeftRadius: theme.radii.lg,
      borderBottomLeftRadius: theme.radii.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    surahName: {
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 16,
      color: theme.semantic.primary,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
    },
    metaLabel: {
      fontFamily: theme.fonts.arabic,
      fontSize: 13,
      color: theme.semantic.fgMuted,
      includeFontPadding: false,
    },
    // `theme.fonts.arabic` maps to KFGQPC-Uthmani which wraps digits in
    // ayah-marker ornaments. Use Latin font for plain visible digits.
    metaNum: {
      fontFamily: theme.fonts.latin,
      fontSize: 14,
      fontWeight: '700',
      color: theme.semantic.fg,
      includeFontPadding: false,
    },
    metaDot: {
      fontFamily: theme.fonts.latin,
      fontSize: 14,
      color: theme.semantic.accent,
      marginHorizontal: 2,
      lineHeight: 16,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.accentSoft,
      borderWidth: 1,
      borderColor: theme.semantic.accent,
    },
    badgeText: {
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 12,
      color: theme.semantic.fgOnGold,
    },
    preview: {
      fontFamily: theme.fonts.quranSerif,
      fontSize: 26,
      lineHeight: 54,
      color: theme.semantic.fg,
      textAlign: 'center',
      writingDirection: 'rtl',
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: '#0E272433',
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timeText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 12,
      color: theme.semantic.accent,
    },
    openCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.primary,
    },
    openText: {
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 13,
      color: theme.semantic.fgOnPrimary,
    },
    deleteAction: {
      backgroundColor: theme.semantic.danger,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    deleteText: {
      color: theme.semantic.fgOnPrimary,
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}

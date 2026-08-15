import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useRecitationStore } from '../../stores/recitationStore';
import { useReadingStore } from '../../stores/readingStore';
import { toArabicIndic, cleanUthmaniForDisplay } from '../../utils/arabic';
import { highlightSearchMatches } from '../../utils/highlight';
import type { AyahSearchResult } from '../../data/quranRepository';

interface Props {
  result: AyahSearchResult;
  surahNameArabic: string;
  surahNameEnglish: string;
  query: string;
  onPress?: (result: AyahSearchResult) => void;
  onPlay?: (result: AyahSearchResult) => void;
  onCopy?: (result: AyahSearchResult) => void;
  onBookmark?: (result: AyahSearchResult) => void;
}

export function AyahResultRow({
  result,
  surahNameArabic,
  surahNameEnglish,
  query,
  onPress,
  onPlay,
  onCopy,
  onBookmark,
}: Props) {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const display = cleanUthmaniForDisplay(result.textUthmani);
  const segments = highlightSearchMatches(display, query);

  const isActiveAyah = useRecitationStore(
    (s) => s.range?.surah === result.surahNumber && s.range?.startAyah === result.ayahNumber,
  );
  const playbackState = useRecitationStore((s) => s.state);
  const isPlaying = isActiveAyah && playbackState === 'playing';
  const isLoading = isActiveAyah && playbackState === 'loading';

  const isBookmarked = useReadingStore((s) =>
    s.bookmarks.some(
      (b) => b.surahNumber === result.surahNumber && b.ayahNumber === result.ayahNumber,
    ),
  );

  const [justCopied, setJustCopied] = useState(false);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    },
    [],
  );
  const handleCopyPress = () => {
    onCopy?.(result);
    setJustCopied(true);
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => setJustCopied(false), 1500);
  };

  const ayahNumber = isArabic ? toArabicIndic(result.ayahNumber) : String(result.ayahNumber);
  const juzNumber = isArabic ? toArabicIndic(result.juzNumber) : String(result.juzNumber);
  const pageNumber = isArabic ? toArabicIndic(result.pageNumber) : String(result.pageNumber);
  const transliteration = surahNameEnglish.toUpperCase();

  const a11yLabel = strings.searchResultAria(
    isArabic ? surahNameArabic : surahNameEnglish,
    result.ayahNumber,
    result.juzNumber,
    result.pageNumber,
  );

  return (
    // The card is not one accessibility element: iOS would merge the nested
    // Play/Copy/Bookmark buttons into it and leave them unreachable. The open
    // action lives on its own labelled Pressable inside instead.
    <Pressable accessible={false} onPress={() => onPress?.(result)}>
      {({ pressed }) => (
        <View style={[styles.card, pressed && styles.cardPressed]}>
          <Pressable
            onPress={() => onPress?.(result)}
            accessibilityRole="button"
            accessibilityLabel={a11yLabel}
            accessibilityHint={strings.searchResultOpenHint}
            style={styles.openArea}
          >
          <View style={styles.headerRow}>
        <View style={styles.ayahPill}>
          <Text style={styles.ayahPillLabel} allowFontScaling>{strings.searchAyahLabel}</Text>
          <Text style={styles.ayahPillNumber} allowFontScaling>{ayahNumber}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.surahNameLatin} numberOfLines={1} allowFontScaling>
            {transliteration}
          </Text>
          <Text style={styles.dot} allowFontScaling>·</Text>
          <Text style={styles.surahNameArabic} numberOfLines={1} allowFontScaling>
            {surahNameArabic}
          </Text>
        </View>
      </View>

      <Text style={styles.scripture} numberOfLines={2} ellipsizeMode="tail" allowFontScaling>
        {segments.map((seg, idx) =>
          seg.highlight ? (
            <Text key={idx} style={styles.scriptureHighlight}>
              {seg.text}
            </Text>
          ) : (
            <Text key={idx}>{seg.text}</Text>
          ),
        )}
      </Text>
          </Pressable>

      <View style={styles.footerRow}>
        <View style={styles.metaCluster}>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel} allowFontScaling>{strings.searchJuzShort}</Text>
            <View style={styles.metaBubble}>
              <Text style={styles.metaBubbleText} allowFontScaling>{juzNumber}</Text>
            </View>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel} allowFontScaling>{strings.searchPageShort}</Text>
            <View style={styles.metaBubble}>
              <Text style={styles.metaBubbleText} allowFontScaling>{pageNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionCluster}>
          <Pressable
            onPress={() => onBookmark?.(result)}
            accessibilityRole="button"
            accessibilityLabel={strings.searchBookmarkAyah}
            accessibilityState={{ selected: isBookmarked }}
            hitSlop={6}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.iconAction,
                  isBookmarked && styles.iconActionActive,
                  pressed && styles.iconActionPressed,
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6 4h12v17l-6-4-6 4z"
                    stroke={isBookmarked ? theme.semantic.primary : theme.semantic.fgMuted}
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                    fill={isBookmarked ? theme.semantic.primary : 'none'}
                  />
                </Svg>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={handleCopyPress}
            accessibilityRole="button"
            accessibilityLabel={strings.searchCopyAyah}
            accessibilityState={{ selected: justCopied }}
            hitSlop={6}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.iconAction,
                  justCopied && styles.iconActionSuccess,
                  pressed && styles.iconActionPressed,
                ]}
              >
                {justCopied ? (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="m5 12 5 5 9-11"
                      stroke={theme.semantic.success}
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Rect
                      x={8}
                      y={3}
                      width={12}
                      height={14}
                      rx={2.5}
                      stroke={theme.semantic.fgMuted}
                      strokeWidth={1.6}
                    />
                    <Path
                      d="M16 17v2.5A2.5 2.5 0 0 1 13.5 22h-7A2.5 2.5 0 0 1 4 19.5v-9A2.5 2.5 0 0 1 6.5 8H8"
                      stroke={theme.semantic.fgMuted}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => onPlay?.(result)}
            accessibilityRole="button"
            accessibilityState={{ selected: isPlaying, busy: isLoading }}
            accessibilityLabel={isPlaying ? strings.searchPauseAyah : strings.searchPlayAyah}
            hitSlop={6}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.playAction,
                  isActiveAyah && styles.playActionActive,
                  pressed && styles.playActionPressed,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.semantic.fgOnPrimary} />
                ) : isPlaying ? (
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Rect x={6} y={5} width={4} height={14} rx={1} fill={theme.semantic.fgOnPrimary} />
                    <Rect x={14} y={5} width={4} height={14} rx={1} fill={theme.semantic.fgOnPrimary} />
                  </Svg>
                ) : (
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path d="M7 4v16l13-8z" fill={theme.semantic.fgOnPrimary} />
                  </Svg>
                )}
              </View>
            )}
          </Pressable>
        </View>
      </View>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  const arabicText = { textAlign: 'left' as const, writingDirection: 'rtl' as const };
  const ltrText = { textAlign: 'left' as const, writingDirection: 'ltr' as const };

  return StyleSheet.create({
    card: {
      backgroundColor: '#FDF9EE',
      borderRadius: theme.radii.lg,
      marginHorizontal: theme.gutter.screen,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg - 2,
      paddingTop: theme.spacing.md + 2,
      paddingBottom: theme.spacing.md - 2,
      gap: theme.spacing.md,
      borderWidth: 1,
      borderColor: '#0E272422',
      shadowColor: '#0E2724',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
      elevation: 5,
    },
    cardPressed: {
      backgroundColor: theme.semantic.bgRaised,
    },
    openArea: {
      gap: theme.spacing.md,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    identity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    surahNameArabic: {
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.size * 1.35,
      color: theme.semantic.fg,
      fontWeight: '700',
      ...arabicText,
      includeFontPadding: false,
    },
    dot: {
      fontFamily: theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.size * 1.2,
      color: theme.semantic.fgSubtle,
      includeFontPadding: false,
    },
    surahNameLatin: {
      fontFamily: theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      lineHeight: theme.typeScale.caption.size * 1.3,
      color: theme.semantic.fgMuted,
      fontWeight: '700',
      letterSpacing: 1.4,
      ...ltrText,
      includeFontPadding: false,
    },

    ayahPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: theme.spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.bgSunken,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.semantic.border,
    },
    ayahPillLabel: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      lineHeight: theme.typeScale.caption.size * 1.3,
      color: theme.semantic.fgMuted,
      fontWeight: '600',
      ...(isArabic ? arabicText : ltrText),
      includeFontPadding: false,
    },
    ayahPillNumber: {
      fontFamily: theme.fonts.latin,
      fontSize: theme.typeScale.caption.size + 1,
      lineHeight: (theme.typeScale.caption.size + 1) * 1.3,
      color: theme.semantic.fg,
      fontWeight: '700',
      ...ltrText,
      includeFontPadding: false,
    },

    scripture: {
      fontFamily: theme.fonts.quranSerif,
      fontSize: theme.typeScale.body.size + 4,
      lineHeight: (theme.typeScale.body.size + 4) * 2.0,
      color: theme.semantic.fg,
      ...arabicText,
      paddingHorizontal: 2,
      paddingTop: theme.spacing.xs,
    },
    scriptureHighlight: {
      backgroundColor: theme.palette.gold[300] + 'B0',
      color: theme.semantic.fg,
    },

    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
    },
    actionCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm + 4,
    },
    playAction: {
      width: 32,
      height: 32,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playActionActive: {
      backgroundColor: theme.semantic.primaryFocus,
    },
    playActionPressed: {
      backgroundColor: theme.semantic.primaryPressed,
      transform: [{ scale: 0.94 }],
    },
    iconAction: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.pill,
    },
    iconActionPressed: {
      backgroundColor: theme.semantic.bgSunken,
      transform: [{ scale: 0.94 }],
    },
    iconActionActive: {
      backgroundColor: theme.semantic.primaryTint,
    },
    iconActionSuccess: {
      backgroundColor: theme.semantic.successSoft,
    },

    metaCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs + 2,
    },
    metaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: theme.spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: theme.radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.semantic.border,
      backgroundColor: theme.semantic.bg,
    },
    metaLabel: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      lineHeight: theme.typeScale.caption.size * 1.3,
      color: theme.semantic.fgMuted,
      fontWeight: '600',
      ...(isArabic ? arabicText : ltrText),
      includeFontPadding: false,
    },
    metaBubble: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.semantic.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metaBubbleText: {
      fontFamily: theme.fonts.latin,
      fontSize: 10,
      lineHeight: 11,
      color: theme.semantic.fg,
      fontWeight: '700',
      includeFontPadding: false,
      textAlign: 'center',
    },
  });
}

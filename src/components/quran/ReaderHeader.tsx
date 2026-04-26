import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';

interface Props {
  surahName: string;
  juzNumber: number;
  pageNumber: number;
  onMore?: () => void;
}

export function ReaderHeader({ surahName, juzNumber, pageNumber, onMore }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const strings = useStrings();
  const language = useSettingsStore((s) => s.language);
  const styles = createStyles(theme);

  const isRTL = language === 'ar';
  const juzText = isRTL ? toArabicIndic(juzNumber) : String(juzNumber);
  const pageText = isRTL ? toArabicIndic(pageNumber) : String(pageNumber);
  const juzWord = isRTL ? 'جزء' : 'Juz';
  const pageWord = isRTL ? 'صفحة' : 'Page';

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/');

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.back}
        onPress={goBack}
        hitSlop={8}
        style={styles.iconBtn}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="m9 6 6 6-6 6" stroke={theme.semantic.fg} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      <View style={styles.center}>
        {surahName ? (
          <>
            <Text style={isRTL ? styles.surah : styles.surahEn} numberOfLines={1}>
              {surahName}
            </Text>
            <View style={styles.bullet} />
          </>
        ) : null}
        <Text style={isRTL ? styles.metaLabel : styles.metaLabelEn}>{juzWord}</Text>
        <Text style={styles.metaDigit}>{juzText}</Text>
        <View style={styles.bullet} />
        <Text style={isRTL ? styles.metaLabel : styles.metaLabelEn}>{pageWord}</Text>
        <Text style={styles.metaDigit}>{pageText}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More"
        onPress={onMore}
        hitSlop={8}
        style={styles.iconBtn}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={6} r={1} fill={theme.semantic.fg} />
          <Circle cx={12} cy={12} r={1} fill={theme.semantic.fg} />
          <Circle cx={12} cy={18} r={1} fill={theme.semantic.fg} />
        </Svg>
      </Pressable>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.gutter.screen - 4,
      paddingTop: 14,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.semantic.border,
      backgroundColor: theme.semantic.bg,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: theme.radii.md - 2,
      backgroundColor: theme.semantic.bgRaised,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    surah: {
      fontFamily: theme.fonts.quran,
      fontSize: theme.typeScale.body.size,
      color: theme.semantic.fg,
    },
    surahEn: {
      fontFamily: theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      fontWeight: '600',
      color: theme.semantic.fg,
    },
    metaLabel: {
      fontFamily: theme.fonts.quran,
      fontSize: theme.typeScale.label.size,
      color: theme.semantic.fgMuted,
      marginEnd: 4,
    },
    metaLabelEn: {
      fontFamily: theme.fonts.latin,
      fontSize: theme.typeScale.label.size,
      color: theme.semantic.fgMuted,
      letterSpacing: 0.2,
      marginEnd: 4,
    },
    metaDigit: {
      fontFamily: theme.fonts.arabic,
      fontSize: theme.typeScale.label.size,
      color: theme.semantic.fgMuted,
    },
    bullet: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.semantic.fgMuted,
      marginHorizontal: 8,
      opacity: 0.55,
    },
  });
}

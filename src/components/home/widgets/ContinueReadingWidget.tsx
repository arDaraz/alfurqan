import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { KhatamStar } from '../../brand/KhatamStar';
import { useStrings } from '../../../constants/strings';
import { useTheme } from '../../../hooks/useTheme';
import { useSettingsStore } from '../../../stores/settingsStore';
import { toArabicIndic } from '../../../utils/arabic';
import { WidgetCard } from './WidgetCard';

interface ResumeProps {
  variant: 'resume';
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  juzNumber: number;
  pageNumber: number;
  onPress: () => void;
}

interface StartProps {
  variant: 'start';
  onPress: () => void;
}

type Props = ResumeProps | StartProps;

/** Last reading position, or an invitation to open Al-Fatihah when there is none. */
export function ContinueReadingWidget(props: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);
  const digits = (n: number) => (isArabic ? toArabicIndic(n) : String(n));

  const isResume = props.variant === 'resume';
  const title = isResume
    ? strings.greetingResumeTitle(props.surahName, digits(props.ayahNumber))
    : strings.greetingBeginPrompt;
  const subtitle = isResume ? strings.greetingJuzPage(digits(props.juzNumber), digits(props.pageNumber)) : null;

  return (
    <WidgetCard label={strings.widgets.continueLabel}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <KhatamStar size={44} color={theme.semantic.accent} strokeWidth={1} fill={theme.semantic.widgetSurface} />
          <Text style={styles.badgeText}>{isResume ? digits(props.surahNumber) : ''}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle !== null && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Pressable
          onPress={props.onPress}
          accessibilityRole="button"
          accessibilityLabel={isResume ? strings.greetingResume : strings.greetingStart}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill={theme.semantic.fgOnGold}>
            <Path d={isArabic ? 'M16 5v14L5 12z' : 'M8 5v14l11-7z'} />
          </Svg>
          <Text style={styles.ctaText}>{isResume ? strings.greetingResume : strings.greetingStart}</Text>
        </Pressable>
      </View>
    </WidgetCard>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    row: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 10,
    },
    badge: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    badgeText: {
      position: 'absolute',
      fontFamily: theme.fonts.latin,
      fontSize: 13,
      fontWeight: '700',
      color: theme.semantic.accent,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 19 : 16,
      lineHeight: isArabic ? 30 : 22,
      fontWeight: isArabic ? 'normal' : '600',
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    subtitle: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 13 : 12,
      lineHeight: isArabic ? 20 : 16,
      color: theme.semantic.fgMuted,
      marginTop: 2,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    cta: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.semantic.accent,
      paddingHorizontal: 15,
      paddingVertical: 7,
      borderRadius: theme.radii.md,
      flexShrink: 0,
    },
    ctaPressed: { backgroundColor: theme.palette.gold[700] },
    ctaText: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 20 : 14,
      fontWeight: isArabic ? 'normal' : '600',
      color: theme.semantic.fgOnGold,
    },
  });
}

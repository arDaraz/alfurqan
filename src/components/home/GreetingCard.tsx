import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Path, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

type ContinueProps = {
  variant: 'continue';
  surahName: string;
  ayahNumber: number;
  juzNumber: number;
  pageNumber: number;
  lastReadAt: number;
  streakDays: number;
  streakAtRisk: boolean;
  onResume: () => void;
};

type ColdStartProps = {
  variant: 'cold-start';
  onStart: () => void;
};

type Props = ContinueProps | ColdStartProps;

/**
 * Greeting / "continue reading" card. Gradient teal with a soft gold radial
 * highlight, featuring the user's last position and a resume CTA.
 */
export function GreetingCard(props: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  if (props.variant === 'cold-start') {
    return (
      <LinearGradient
        colors={[theme.palette.teal[700], theme.palette.teal[500], theme.palette.teal[500]]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        <CardGlow theme={theme} styles={styles} />
        <Text style={styles.label}>{strings.greetingContinueLabel}</Text>
        <Text style={styles.title}>{strings.greetingBeginPrompt}</Text>
        <View style={styles.cta}>
          <Pressable
            onPress={props.onStart}
            accessibilityRole="button"
            accessibilityLabel={strings.greetingStart}
          >
            {({ pressed }) => (
              <View style={[styles.btn, pressed && styles.btnPressed]}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill={theme.semantic.fgOnGold}>
                  <Path d={isArabic ? 'M16 5v14L5 12z' : 'M8 5v14l11-7z'} />
                </Svg>
                <Text style={styles.btnText}>{strings.greetingStart}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const title = isArabic
    ? `سورة ${props.surahName} ‏· الآية ‏﴿${toArabicIndic(props.ayahNumber)}﴾`
    : `Surah ${props.surahName} · Ayah ${props.ayahNumber}`;
  const subtitle = isArabic
    ? strings.greetingJuzPage(toArabicIndic(props.juzNumber), toArabicIndic(props.pageNumber))
    : strings.greetingJuzPage(props.juzNumber, props.pageNumber);
  const relative = formatRelativeTime(Date.now(), props.lastReadAt, isArabic ? 'ar' : 'en');

  return (
    <LinearGradient
      colors={[theme.palette.teal[700], theme.palette.teal[500], theme.palette.teal[500]]}
      locations={[0, 0.55, 1]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <CardGlow theme={theme} styles={styles} />
      <Text style={styles.label}>{strings.greetingContinueLabel}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.timestamp}>{strings.greetingLastReadAgo(relative)}</Text>
      <View style={styles.cta}>
        <Pressable
          onPress={props.onResume}
          accessibilityRole="button"
          accessibilityLabel={strings.greetingResume}
        >
          {({ pressed }) => (
            <View style={[styles.btn, pressed && styles.btnPressed]}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill={theme.semantic.fgOnGold}>
                <Path d={isArabic ? 'M16 5v14L5 12z' : 'M8 5v14l11-7z'} />
              </Svg>
              <Text style={styles.btnText}>{strings.greetingResume}</Text>
            </View>
          )}
        </Pressable>
        {props.streakAtRisk ? (
          <Text style={styles.streakRisk}>{strings.greetingStreakAtRisk}</Text>
        ) : isArabic ? (
          <Text style={styles.streakLabel}>سلسلة {toArabicIndic(props.streakDays)} يوم</Text>
        ) : (
          <View style={styles.streak}>
            <Text style={styles.streakNum}>{props.streakDays}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

function CardGlow({
  theme,
  styles,
}: {
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Svg style={styles.glow} width={180} height={180} viewBox="0 0 180 180" pointerEvents="none">
      <Defs>
        <SvgRadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={theme.semantic.accentSoft} stopOpacity={0.18} />
          <Stop offset="60%" stopColor={theme.semantic.accentSoft} stopOpacity={0} />
        </SvgRadialGradient>
      </Defs>
      <Circle cx={90} cy={90} r={90} fill="url(#glowGrad)" />
    </Svg>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    card: {
      direction: isArabic ? 'rtl' : 'ltr',
      marginHorizontal: theme.gutter.screen - 6,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md + 2,
      borderRadius: theme.radii.xl - 6,
      overflow: 'hidden',
      ...theme.elevation.shadow2,
    },
    glow: {
      position: 'absolute',
      top: -30,
      left: -30,
    },
    label: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 10,
      letterSpacing: isArabic ? 0 : 2.2,
      fontWeight: isArabic ? 'normal' : '700',
      color: theme.semantic.accentSoft,
      textTransform: isArabic ? 'none' : 'uppercase',
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    title: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 22,
      color: theme.palette.paper[50],
      marginTop: 6,
      marginBottom: 2,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      lineHeight: 34,
      fontWeight: isArabic ? 'normal' : '700',
    },
    subtitle: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 13 : 11,
      color: theme.palette.paper[50],
      opacity: 0.78,
      letterSpacing: isArabic ? 0 : 0.4,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    timestamp: {
      fontFamily: theme.fonts.latin,
      fontSize: 11,
      color: theme.palette.paper[50],
      opacity: 0.6,
      marginTop: 4,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md - 2,
    },
    btn: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.semantic.accent,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: theme.radii.sm + 4,
    },
    btnPressed: {
      backgroundColor: theme.palette.gold[700],
    },
    btnText: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 14,
      color: theme.semantic.fgOnGold,
      fontWeight: isArabic ? 'normal' : '600',
    },
    streak: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    streakNum: {
      fontFamily: theme.fonts.latin,
      fontWeight: '800',
      fontSize: 14,
      color: theme.semantic.accent,
    },
    streakLabel: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 12,
      color: theme.palette.paper[50],
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    streakRisk: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 12,
      fontWeight: isArabic ? 'normal' : '700',
      color: theme.semantic.accent,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}

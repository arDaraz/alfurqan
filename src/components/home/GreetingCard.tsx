import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Path, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { toArabicIndic } from '../../utils/arabic';

interface Props {
  surahName: string;
  ayahNumber: number;
  juzNumber: number;
  streakDays: number;
  onResume: () => void;
}

/**
 * Greeting / "continue reading" card. Gradient teal with a soft gold radial
 * highlight, featuring the user's last position and a resume CTA.
 */
export function GreetingCard({
  surahName,
  ayahNumber,
  juzNumber,
  streakDays,
  onResume,
}: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={[theme.palette.teal[700], theme.palette.teal[500], theme.palette.teal[500]]}
      locations={[0, 0.55, 1]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <Svg style={styles.glow} width={180} height={180} viewBox="0 0 180 180" pointerEvents="none">
        <Defs>
          <SvgRadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={theme.semantic.accentSoft} stopOpacity={0.18} />
            <Stop offset="60%" stopColor={theme.semantic.accentSoft} stopOpacity={0} />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={90} cy={90} r={90} fill="url(#glowGrad)" />
      </Svg>
      <Text style={styles.label}>Continue · {strings.greetingContinueLabel}</Text>
      <Text style={styles.title}>
        {`سورة ${surahName} ‏· الآية ‏﴿${toArabicIndic(ayahNumber)}﴾`}
      </Text>
      <Text style={styles.subtitle}>
        Āyat al-Kursī · Juz {juzNumber}
      </Text>
      <View style={styles.cta}>
        <Pressable
          onPress={onResume}
          accessibilityRole="button"
          accessibilityLabel={strings.greetingResume}
        >
          {({ pressed }) => (
            <View style={[styles.btn, pressed && styles.btnPressed]}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill={theme.semantic.fgOnGold}>
                <Path d="M8 5v14l11-7z" />
              </Svg>
              <Text style={styles.btnText}>{strings.greetingResume}</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.streak}>
          <Text style={styles.streakNum}>{streakDays}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
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
      fontFamily: theme.fonts.latin,
      fontSize: 10,
      letterSpacing: 2.2,
      fontWeight: '700',
      color: theme.semantic.accentSoft,
      textTransform: 'uppercase',
      // forceRTL flips physical alignment, so `'left'` => physical right.
      textAlign: 'left',
      writingDirection: 'ltr',
    },
    title: {
      fontFamily: theme.fonts.quran,
      fontSize: 22,
      color: theme.palette.paper[50],
      marginTop: 6,
      marginBottom: 2,
      textAlign: 'left',
      writingDirection: 'rtl',
      lineHeight: 34,
    },
    subtitle: {
      fontFamily: theme.fonts.latin,
      fontSize: 11,
      color: theme.palette.paper[50],
      opacity: 0.78,
      letterSpacing: 0.4,
      textAlign: 'left',
      writingDirection: 'ltr',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md - 2,
    },
    btn: {
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
      fontFamily: theme.fonts.quran,
      fontSize: 14,
      color: theme.semantic.fgOnGold,
    },
    // `direction:ltr` in design — number reads first, then label.
    // `row-reverse` undoes the global forceRTL so JSX order = visual order.
    streak: {
      flexDirection: 'row-reverse',
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
      fontFamily: theme.fonts.latin,
      fontSize: 12,
      color: theme.palette.paper[50],
    },
  });
}

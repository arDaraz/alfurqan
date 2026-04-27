import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { useStrings } from '../constants/strings';
import { OrnamentDivider } from '../components/brand/OrnamentDivider';
import { MicVisualizer } from '../components/practice/MicVisualizer';
import { toArabicIndic } from '../utils/arabic';

type WordState = 'ok' | 'cur' | 'bad' | 'pending';

interface PracticeWord {
  text: string;
  state: WordState;
}

/** Demo state — Al-Fātiḥah ayah 2 with one word flagged for correction. */
const DEMO_WORDS: PracticeWord[] = [
  { text: 'ٱلْحَمْدُ', state: 'ok' },
  { text: 'لِلَّهِ', state: 'ok' },
  { text: 'رَبِّ', state: 'ok' },
  { text: 'ٱلْعَٰلَمِينَ', state: 'bad' },
];

const ACTIVE_AYAH_NUMBER = 2;

export default function PracticeScreen() {
  const theme = useTheme();
  const strings = useStrings();
  const router = useRouter();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={strings.back}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="m15 6-6 6 6 6" stroke={theme.semantic.fg} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <View style={styles.title}>
          <Text style={styles.titleArabic}>{strings.practiceTitle}</Text>
          <Text style={styles.titleSub}>Al-Fātiḥah · 7 ayāt</Text>
        </View>
        <View style={[styles.iconBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <View style={styles.divider}>
        <OrnamentDivider tier="medium" color={theme.semantic.accent} darkMode={theme.mode === 'dark'} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        <View style={styles.verseBox}>
          <Text style={styles.verseMeta}>
            الآية {toArabicIndic(ACTIVE_AYAH_NUMBER)} · Ayah {ACTIVE_AYAH_NUMBER}
          </Text>
          <View style={styles.verseRow}>
            {DEMO_WORDS.map((w, i) => (
              <PracticeWordSpan key={i} word={w} />
            ))}
            <Text style={styles.endNumber}>﴿{toArabicIndic(ACTIVE_AYAH_NUMBER)}﴾</Text>
          </View>
        </View>

        <View style={styles.chip}>
          <View style={styles.chipIcon}>
            <Text style={styles.chipIconText}>!</Text>
          </View>
          <View style={styles.chipBody}>
            <Text style={styles.chipWord}>ٱلْعَٰلَمِينَ</Text>
            <Text style={styles.chipExplain}>{strings.practiceMistakeHint}</Text>
            <View style={styles.chipActions}>
              <Pressable style={[styles.chipBtn, styles.chipBtnPrimary]}>
                <Svg width={11} height={11} viewBox="0 0 24 24" fill={theme.palette.paper[50]}>
                  <Path d="M8 5v14l11-7z" />
                </Svg>
                <Text style={styles.chipBtnPrimaryText}>{strings.practiceListenSample}</Text>
              </Pressable>
              <Pressable style={styles.chipBtn}>
                <Text style={styles.chipBtnText}>{strings.practiceSkip}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.micArea}>
        <MicVisualizer />
        <View style={styles.micRow}>
          <View style={styles.micSide}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M11 5 6 9H2v6h4l5 4V5z" stroke={theme.semantic.fg} strokeWidth={1.75} strokeLinejoin="round" />
              <Path d="M19.5 12a4 4 0 0 0-2-3.5v7a4 4 0 0 0 2-3.5z" stroke={theme.semantic.fg} strokeWidth={1.75} />
            </Svg>
          </View>
          <MicButton />
          <View style={styles.micSide}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Rect x={6} y={5} width={4} height={14} rx={1} stroke={theme.semantic.fg} strokeWidth={1.75} />
              <Rect x={14} y={5} width={4} height={14} rx={1} stroke={theme.semantic.fg} strokeWidth={1.75} />
            </Svg>
          </View>
        </View>
        <View style={styles.listenRow}>
          <View style={styles.recDot} />
          <Text style={styles.listenLabel}>{strings.practiceListening}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function PracticeWordSpan({ word }: { word: PracticeWord }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (word.state !== 'cur') return;
    pulse.value = withRepeat(
      withTiming(1.04, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [word.state, pulse]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: word.state === 'cur' ? pulse.value : 1 }],
  }));

  const styleByState: Record<WordState, any> = {
    ok: {
      backgroundColor: theme.semantic.successSoft,
    },
    cur: {
      backgroundColor: theme.palette.gold[300] + '50',
      borderWidth: 1.5,
      borderColor: theme.palette.gold[500],
    },
    bad: {
      borderBottomWidth: 2,
      borderBottomColor: theme.semantic.danger,
      borderStyle: 'dashed',
    },
    pending: {},
  };

  const textColor =
    word.state === 'ok'
      ? theme.palette.ink[700]
      : word.state === 'bad'
        ? theme.semantic.danger
        : theme.semantic.fg;

  return (
    <Animated.View style={[styles.wordWrap, styleByState[word.state], animStyle]}>
      <Text style={[styles.word, { color: textColor }]}>{word.text}</Text>
    </Animated.View>
  );
}

function MicButton() {
  const theme = useTheme();
  const router = useRouter();
  const ringScale = useSharedValue(0.9);
  const ringOpacity = useSharedValue(0.6);
  useEffect(() => {
    ringScale.value = withRepeat(withTiming(1.25, { duration: 2000 }), -1, false);
    ringOpacity.value = withRepeat(withTiming(0, { duration: 2000 }), -1, false);
  }, [ringScale, ringOpacity]);
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  const styles = createStyles(theme);
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Toggle mic"
      style={styles.micBtn}
    >
      <Animated.View style={[styles.micBtnRing, ringStyle]} />
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Rect x={9} y={3} width={6} height={12} rx={3} stroke={theme.semantic.fgOnPrimary} strokeWidth={1.75} />
        <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={theme.semantic.fgOnPrimary} strokeWidth={1.75} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.semantic.bg },
    header: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
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
    title: { flex: 1, alignItems: 'center' },
    titleArabic: {
      fontFamily: theme.fonts.arabic,
      fontSize: 20,
      fontWeight: '600',
      color: theme.semantic.fg,
    },
    titleSub: {
      fontFamily: theme.fonts.latin,
      fontSize: 11,
      letterSpacing: 2.2,
      color: theme.semantic.fgMuted,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    divider: {
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    scrollBody: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
    },
    verseBox: {
      backgroundColor: theme.semantic.bgRaised,
      borderColor: theme.semantic.borderGold,
      borderWidth: 1,
      borderRadius: theme.radii.lg,
      paddingVertical: theme.spacing.lg - 2,
      paddingHorizontal: theme.spacing.lg - 2,
      ...theme.elevation.shadow1,
    },
    verseMeta: {
      fontFamily: theme.fonts.latin,
      fontSize: 10,
      letterSpacing: 2.2,
      color: theme.semantic.accent,
      textTransform: 'uppercase',
      fontWeight: '600',
      textAlign: 'right',
      marginBottom: 10,
    },
    verseRow: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 4,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    wordWrap: {
      paddingHorizontal: 5,
      paddingVertical: 3,
      borderRadius: theme.radii.xs,
    },
    word: {
      fontFamily: theme.fonts.quran,
      fontSize: 26,
      lineHeight: 26 * 1.6,
    },
    endNumber: {
      color: theme.semantic.accent,
      fontFamily: theme.fonts.latin,
      fontWeight: '600',
      fontSize: 13,
      marginHorizontal: 4,
    },
    chip: {
      marginTop: theme.spacing.md,
      backgroundColor: theme.semantic.dangerSoft,
      borderColor: theme.semantic.danger,
      borderWidth: 1,
      borderRadius: theme.radii.md,
      padding: 14,
      flexDirection: 'row-reverse',
      gap: 12,
      alignItems: 'flex-start',
      ...theme.elevation.shadow1,
    },
    chipIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.semantic.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipIconText: {
      color: theme.palette.paper[50],
      fontWeight: '700',
      fontSize: 12,
      lineHeight: 14,
    },
    chipBody: {
      flex: 1,
    },
    chipWord: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      fontWeight: '600',
      color: '#6B2B2B',
      textAlign: 'right',
    },
    chipExplain: {
      fontFamily: theme.fonts.latin,
      fontSize: 12,
      color: theme.semantic.fgMuted,
      marginTop: 4,
    },
    chipActions: {
      flexDirection: 'row-reverse',
      gap: 6,
      marginTop: 10,
    },
    chipBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.semantic.bg,
      borderColor: theme.semantic.border,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: theme.radii.sm + 2,
    },
    chipBtnPrimary: {
      backgroundColor: theme.semantic.danger,
      borderColor: theme.semantic.danger,
    },
    chipBtnText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 12,
      color: theme.semantic.fg,
      fontWeight: '500',
    },
    chipBtnPrimaryText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 12,
      color: theme.palette.paper[50],
      fontWeight: '500',
    },
    micArea: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    micRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
    },
    micBtn: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: theme.semantic.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: theme.semantic.bg,
      borderWidth: 3,
      ...theme.elevation.shadowFloat,
    },
    micBtnRing: {
      position: 'absolute',
      top: -10,
      bottom: -10,
      left: -10,
      right: -10,
      borderRadius: 48,
      borderColor: theme.semantic.primary,
      borderWidth: 1.5,
      opacity: 0.3,
    },
    micSide: {
      width: 48,
      height: 48,
      borderRadius: theme.radii.md,
      backgroundColor: theme.semantic.bgRaised,
      borderColor: theme.semantic.border,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    recDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.semantic.danger,
    },
    listenLabel: {
      fontFamily: theme.fonts.latin,
      fontSize: 11,
      letterSpacing: 2.4,
      color: theme.semantic.primary,
      textTransform: 'uppercase',
      fontWeight: '700',
    },
  });
}

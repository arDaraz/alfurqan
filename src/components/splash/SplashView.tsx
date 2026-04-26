import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { LogoGlyph } from '../brand/LogoGlyph';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';

/**
 * Splash view shown while fonts/data load. Implements the v2 spec:
 * dark-teal `bg-inverse`, gold corner brackets, breathing rosette glyph,
 * الفرقان wordmark, gold separator rule, Fraunces italic tagline,
 * letter-spaced romanisation, and a small dot loader.
 */
export function SplashView() {
  const theme = useTheme();
  const strings = useStrings();
  const { width, height } = Dimensions.get('window');
  const styles = createStyles(theme, width, height);

  // Breathing animation — 4.5s ambient cycle, design's `--dur-ambient`.
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2250, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2250, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [scale]);
  const glyphAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.frame} />
      <View style={[styles.cornerBracket, styles.cornerTL]} />
      <View style={[styles.cornerBracket, styles.cornerBR]} />
      <View style={[styles.cornerBracket, styles.cornerTR]} />
      <View style={[styles.cornerBracket, styles.cornerBL]} />

      <View style={styles.stack}>
        <Animated.View style={glyphAnimStyle}>
          <LogoGlyph
            size={136}
            bg={theme.semantic.bgInverse}
            gold={theme.semantic.accent}
            goldSoft={theme.semantic.accentSoft}
          />
        </Animated.View>
        <Text style={styles.word}>{strings.appTitle}</Text>
        <View style={styles.rule} />
        <Text style={styles.tagline}>{strings.appTagline}</Text>
        <Text style={styles.roman}>T A S M I ʿ</Text>
      </View>

      <View style={styles.loader}>
        <BreathingDot delay={0} />
        <BreathingDot delay={200} />
        <BreathingDot delay={400} />
      </View>
    </View>
  );
}

function BreathingDot({ delay }: { delay: number }) {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: delay, easing: Easing.linear }),
        withTiming(1, { duration: 420, easing: Easing.out(Easing.ease) }),
        withTiming(0.3, { duration: 540, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
  }, [opacity, delay]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: theme.semantic.accent,
        },
        animStyle,
      ]}
    />
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, width: number, height: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0E2724',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    frame: {
      position: 'absolute',
      top: 28,
      left: 28,
      right: 28,
      bottom: 28,
      borderColor: theme.palette.gold[500],
      borderWidth: 1,
      borderRadius: 18,
      opacity: 0.35,
    },
    cornerBracket: {
      position: 'absolute',
      width: 28,
      height: 28,
      borderColor: theme.palette.gold[500],
      opacity: 0.6,
    },
    cornerTL: {
      top: 22,
      left: 22,
      borderTopWidth: 1,
      borderLeftWidth: 1,
    },
    cornerBR: {
      bottom: 22,
      right: 22,
      borderBottomWidth: 1,
      borderRightWidth: 1,
    },
    cornerTR: {
      top: 22,
      right: 22,
      borderTopWidth: 1,
      borderRightWidth: 1,
    },
    cornerBL: {
      bottom: 22,
      left: 22,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
    },
    stack: {
      alignItems: 'center',
      gap: 28,
    },
    word: {
      fontFamily: theme.fonts.arabic,
      fontSize: 72,
      fontWeight: '600',
      color: theme.palette.paper[50],
      letterSpacing: 1.4,
      lineHeight: 84,
    },
    rule: {
      width: 120,
      height: 1,
      backgroundColor: theme.palette.gold[500],
      opacity: 0.55,
    },
    tagline: {
      fontFamily: theme.fonts.latinDisplay,
      fontStyle: 'italic',
      fontSize: 20,
      color: '#EFE5CEB8',
    },
    roman: {
      fontFamily: theme.fonts.latin,
      fontSize: 11,
      letterSpacing: 5.7,
      color: theme.palette.gold[300],
      marginTop: -16,
    },
    loader: {
      position: 'absolute',
      bottom: 54,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
  });
}

import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { LogoGlyph } from '../brand/LogoGlyph';
import { OrnamentDivider } from '../brand/OrnamentDivider';
import { OnboardingDots } from './OnboardingDots';

interface OnboardingScreenProps {
  heading: string;
  body: string;
  illustrationIcon: string;
  isLastScreen: boolean;
  screenIndex: number;
  totalScreens: number;
  onGetStarted?: () => void;
  /** Whether this is the first page (gets the brand glyph instead of an icon). */
  isFirstScreen?: boolean;
}

/**
 * Onboarding page — uses the brand rosette on the first slide and
 * Lucide-style icons on subsequent ones, with the v2 type ramp and
 * a sage/gold ornament divider between hero and copy.
 */
export function OnboardingScreen({
  heading,
  body,
  illustrationIcon,
  isLastScreen,
  screenIndex,
  totalScreens,
  isFirstScreen,
  onGetStarted,
}: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const strings = useStrings();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.bottom);

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.illustrationArea}>
        {isFirstScreen ? (
          <LogoGlyph
            size={140}
            bg={theme.semantic.primary}
            gold={theme.semantic.accentSoft}
            goldSoft={theme.semantic.accentSoft}
          />
        ) : (
          <MaterialCommunityIcons
            name={illustrationIcon as any}
            size={110}
            color={theme.semantic.accent}
          />
        )}
      </View>

      <View style={styles.divider}>
        <OrnamentDivider tier="compact" color={theme.semantic.accent} darkMode={theme.mode === 'dark'} />
      </View>

      <View style={styles.textContent}>
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      <View style={styles.bottomArea}>
        <OnboardingDots total={totalScreens} active={screenIndex} />
        {isLastScreen ? (
          <Pressable
            onPress={onGetStarted}
            accessibilityLabel={strings.getStarted}
            accessibilityRole="button"
            style={({ pressed }) => [styles.ctaHitArea, pressed && styles.ctaPressed]}
          >
            <View style={styles.ctaSurface}>
              <Text style={styles.ctaText}>{strings.getStarted}</Text>
            </View>
          </Pressable>
        ) : (
          <Text style={styles.swipeHint}>{strings.swipeToContinue}</Text>
        )}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, bottomInset: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
      justifyContent: 'space-between',
    },
    illustrationArea: {
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing['3xl'],
    },
    divider: {
      alignItems: 'center',
      marginVertical: theme.spacing.md,
    },
    textContent: {
      flex: 1,
      justifyContent: 'flex-start',
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    heading: {
      fontFamily: theme.fonts.latin,
      fontSize: 26,
      fontWeight: '700',
      color: theme.semantic.fg,
      textAlign: 'center',
      lineHeight: 31,
    },
    body: {
      fontFamily: theme.fonts.latin,
      fontSize: 16,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 320,
    },
    bottomArea: {
      paddingBottom: Math.max(bottomInset, theme.spacing.md) + theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    ctaHitArea: {
      minWidth: 220,
      minHeight: 52,
    },
    ctaSurface: {
      height: 52,
      minWidth: 220,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.semantic.primary,
      ...theme.elevation.shadow2,
    },
    ctaPressed: {
      opacity: 0.86,
    },
    ctaText: {
      fontFamily: theme.fonts.latin,
      fontSize: 16,
      fontWeight: '600',
      color: theme.semantic.fgOnPrimary,
      letterSpacing: 0,
    },
    swipeHint: {
      fontFamily: theme.fonts.latin,
      fontSize: 13,
      color: theme.semantic.fgSubtle,
      textAlign: 'center',
      letterSpacing: 0,
    },
  });
}

import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { LogoGlyph } from '../brand/LogoGlyph';
import { OrnamentDivider } from '../brand/OrnamentDivider';

interface OnboardingScreenProps {
  heading: string;
  body: string;
  illustrationIcon: string;
  isLastScreen: boolean;
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
  isFirstScreen,
  onGetStarted,
}: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const strings = useStrings();
  const styles = createStyles(theme);

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
        {isLastScreen ? (
          <Pressable
            onPress={onGetStarted}
            accessibilityLabel={strings.getStarted}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>{strings.getStarted}</Text>
          </Pressable>
        ) : (
          <Text style={styles.swipeHint}>{strings.swipeToContinue}</Text>
        )}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
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
      paddingBottom: theme.spacing['3xl'],
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    cta: {
      backgroundColor: theme.semantic.primary,
      height: 48,
      minWidth: 220,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.elevation.shadow2,
    },
    ctaPressed: {
      backgroundColor: theme.semantic.primaryPressed,
    },
    ctaText: {
      fontFamily: theme.fonts.latin,
      fontSize: 16,
      fontWeight: '600',
      color: theme.semantic.fgOnPrimary,
      letterSpacing: 0.16,
    },
    swipeHint: {
      fontFamily: theme.fonts.latin,
      fontSize: 13,
      color: theme.semantic.fgSubtle,
      textAlign: 'center',
      letterSpacing: 0.4,
    },
  });
}

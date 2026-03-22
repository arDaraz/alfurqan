import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useSettingsStore } from '../../stores/settingsStore';

interface OnboardingScreenProps {
  headingEn: string;
  headingAr: string;
  bodyEn: string;
  bodyAr: string;
  illustrationIcon: string;
  isLastScreen: boolean;
  onGetStarted?: () => void;
}

export function OnboardingScreen({
  headingEn,
  headingAr,
  bodyEn,
  bodyAr,
  illustrationIcon,
  isLastScreen,
  onGetStarted,
}: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const language = useSettingsStore((s) => s.language);
  const isArabicFirst = language === 'ar';

  const headingPrimary = isArabicFirst ? headingAr : headingEn;
  const headingSecondary = isArabicFirst ? headingEn : headingAr;
  const bodyPrimary = isArabicFirst ? bodyAr : bodyEn;
  const bodySecondary = isArabicFirst ? bodyEn : bodyAr;

  const isPrimaryArabic = isArabicFirst;

  return (
    <View style={[styles.container, { width }]}>
      {/* Illustration area */}
      <View style={styles.illustrationArea}>
        <MaterialCommunityIcons
          name={illustrationIcon as any}
          size={120}
          color={theme.colors.accent}
        />
      </View>

      {/* Text content */}
      <View style={styles.textContent}>
        {/* Primary heading */}
        <Text
          style={[
            styles.heading,
            isPrimaryArabic && styles.arabicText,
          ]}
        >
          {headingPrimary}
        </Text>

        {/* Secondary heading */}
        <Text
          style={[
            styles.heading,
            styles.headingSecondary,
            !isPrimaryArabic && styles.arabicText,
          ]}
        >
          {headingSecondary}
        </Text>

        {/* Primary body */}
        <Text
          style={[
            styles.body,
            isPrimaryArabic && styles.arabicBody,
          ]}
        >
          {bodyPrimary}
        </Text>

        {/* Secondary body */}
        <Text
          style={[
            styles.body,
            styles.bodySecondary,
            !isPrimaryArabic && styles.arabicBody,
          ]}
        >
          {bodySecondary}
        </Text>
      </View>

      {/* Bottom area */}
      <View style={styles.bottomArea}>
        {isLastScreen ? (
          <Pressable
            onPress={onGetStarted}
            accessibilityLabel="Get Started"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.getStartedButton,
              pressed && styles.getStartedButtonPressed,
            ]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Text style={[styles.getStartedTextAr, styles.arabicText]}>
              ابدأ الآن
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.swipeHint}>Swipe to continue</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
  },
  illustrationArea: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing['3xl'],
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  heading: {
    fontSize: theme.typography.display.size,
    fontWeight: theme.typography.display.weight,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: theme.typography.display.size * theme.typography.display.latinLineHeight,
  },
  headingSecondary: {
    marginTop: theme.spacing.sm,
  },
  arabicText: {
    fontFamily: theme.fonts.arabic,
    writingDirection: 'rtl',
    lineHeight: theme.typography.display.size * theme.typography.display.arabicLineHeight,
  },
  body: {
    fontSize: theme.typography.body.size,
    fontWeight: theme.typography.body.weight,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: theme.typography.body.size * theme.typography.body.latinLineHeight,
  },
  bodySecondary: {
    marginTop: theme.spacing.sm,
  },
  arabicBody: {
    fontFamily: theme.fonts.arabic,
    writingDirection: 'rtl',
    lineHeight: theme.typography.body.size * theme.typography.body.arabicLineHeight,
  },
  bottomArea: {
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  getStartedButton: {
    backgroundColor: theme.colors.primary,
    height: 44,
    minWidth: 200,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  getStartedButtonPressed: {
    backgroundColor: theme.colors.primaryDark,
  },
  getStartedText: {
    fontSize: theme.typography.body.size,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  getStartedTextAr: {
    fontSize: theme.typography.body.size,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  swipeHint: {
    fontSize: theme.typography.label.size,
    fontWeight: '400',
    color: theme.colors.textDisabled,
    textAlign: 'center',
  },
});

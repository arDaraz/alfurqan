import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useStrings } from '../../constants/strings';

interface OnboardingScreenProps {
  heading: string;
  body: string;
  illustrationIcon: string;
  isLastScreen: boolean;
  onGetStarted?: () => void;
}

export function OnboardingScreen({
  heading,
  body,
  illustrationIcon,
  isLastScreen,
  onGetStarted,
}: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const strings = useStrings();

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
        <Text style={styles.heading}>
          {heading}
        </Text>

        <Text style={styles.body}>
          {body}
        </Text>
      </View>

      {/* Bottom area */}
      <View style={styles.bottomArea}>
        {isLastScreen ? (
          <TouchableOpacity
            onPress={onGetStarted}
            accessibilityLabel={strings.getStarted}
            accessibilityRole="button"
            activeOpacity={0.7}
            style={styles.getStartedButton}
          >
            <Text style={styles.getStartedText}>{strings.getStarted}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.swipeHint}>{strings.swipeToContinue}</Text>
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
  body: {
    fontSize: theme.typography.body.size,
    fontWeight: theme.typography.body.weight,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: theme.typography.body.size * theme.typography.body.latinLineHeight,
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
  },
  getStartedText: {
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

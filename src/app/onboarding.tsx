import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../components/onboarding/OnboardingScreen';
import { useReadingStore } from '../stores/readingStore';
import { useStrings } from '../constants/strings';
import { useTheme } from '../hooks/useTheme';

const ILLUSTRATION_ICONS = ['microphone', 'rocket-launch'];

export default function Onboarding() {
  const router = useRouter();
  const strings = useStrings();
  const theme = useTheme();

  const screens = strings.onboarding.map((s, i) => ({
    heading: s.heading,
    body: s.body,
    illustrationIcon: ILLUSTRATION_ICONS[i - 1] ?? '',
    isLastScreen: i === strings.onboarding.length - 1,
    isFirstScreen: i === 0,
  }));

  const handleGetStarted = useCallback(() => {
    useReadingStore.getState().completeOnboarding();
    router.replace('/(tabs)');
  }, [router]);

  const [reduceMotion, setReduceMotion] = useState(false);
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.semantic.bg }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate={reduceMotion ? 'normal' : 'fast'}
        scrollEventThrottle={16}
      >
        {screens.map((screen, index) => (
          <OnboardingScreen
            key={index}
            heading={screen.heading}
            body={screen.body}
            illustrationIcon={screen.illustrationIcon}
            isLastScreen={screen.isLastScreen}
            isFirstScreen={screen.isFirstScreen}
            screenIndex={index}
            totalScreens={screens.length}
            onGetStarted={screen.isLastScreen ? handleGetStarted : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

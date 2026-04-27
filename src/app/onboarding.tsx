import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../components/onboarding/OnboardingScreen';
import { OnboardingDots } from '../components/onboarding/OnboardingDots';
import { useReadingStore } from '../stores/readingStore';
import { useStrings } from '../constants/strings';
import { useTheme } from '../hooks/useTheme';

const ILLUSTRATION_ICONS = ['microphone', 'rocket-launch'];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const strings = useStrings();
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const screens = strings.onboarding.map((s, i) => ({
    heading: s.heading,
    body: s.body,
    illustrationIcon: ILLUSTRATION_ICONS[i - 1] ?? '',
    isLastScreen: i === strings.onboarding.length - 1,
    isFirstScreen: i === 0,
  }));

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(offsetX / width);
      setActiveIndex(pageIndex);
    },
    [width]
  );

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
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
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
            onGetStarted={screen.isLastScreen ? handleGetStarted : undefined}
          />
        ))}
      </ScrollView>
      <View style={styles.dotsContainer}>
        <OnboardingDots total={screens.length} active={activeIndex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

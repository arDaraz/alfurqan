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
import { theme } from '../constants/theme';

const ILLUSTRATION_ICONS = ['book-open-variant', 'microphone', 'rocket-launch'];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const strings = useStrings();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const screens = strings.onboarding.map((s, i) => ({
    heading: s.heading,
    body: s.body,
    illustrationIcon: ILLUSTRATION_ICONS[i],
    isLastScreen: i === strings.onboarding.length - 1,
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

  // Check reduced motion preference for scroll deceleration
  const [reduceMotion, setReduceMotion] = useState(false);
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  return (
    <View style={styles.container}>
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
            onGetStarted={screen.isLastScreen ? handleGetStarted : undefined}
          />
        ))}
      </ScrollView>

      {/* Page dots positioned at bottom */}
      <View style={styles.dotsContainer}>
        <OnboardingDots total={screens.length} active={activeIndex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

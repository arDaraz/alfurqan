import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  AccessibilityInfo,
  I18nManager,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../components/onboarding/OnboardingScreen';
import {
  onboardingIndexFromOffset,
  onboardingPageOffset,
} from '../components/onboarding/paging';
import { useReadingStore } from '../stores/readingStore';
import { useStrings } from '../constants/strings';
import { useTheme } from '../hooks/useTheme';

const ILLUSTRATION_ICONS = ['microphone', 'rocket-launch'];

export default function Onboarding() {
  const router = useRouter();
  const strings = useStrings();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const handleNext = useCallback(
    (fromIndex: number) => {
      const target = Math.min(fromIndex + 1, screens.length - 1);
      scrollRef.current?.scrollTo({
        x: onboardingPageOffset(target, screens.length, width, I18nManager.isRTL),
        animated: true,
      });
      setActiveIndex(target);
    },
    [screens.length, width]
  );

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setActiveIndex(
        onboardingIndexFromOffset(
          event.nativeEvent.contentOffset.x,
          screens.length,
          width,
          I18nManager.isRTL
        )
      );
    },
    [screens.length, width]
  );

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
        bounces={false}
        decelerationRate={reduceMotion ? 'normal' : 'fast'}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
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
            isActive={index === activeIndex}
            onNext={() => handleNext(index)}
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

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
import { theme } from '../constants/theme';

const SCREENS = [
  {
    headingEn: 'Your Digital Memorization Partner',
    headingAr: 'شريكك الرقمي في الحفظ',
    bodyEn:
      'Practice your Quran memorization anytime, anywhere — receive instant correction like a real teacher.',
    bodyAr:
      'تدرّب على حفظ القرآن في أي وقت ومكان — تصحيح فوري كالمعلم الحقيقي',
    illustrationIcon: 'book-open-variant',
    isLastScreen: false,
  },
  {
    headingEn: 'Recite. We Listen. Instant Feedback.',
    headingAr: 'اقرأ. نسمع. تصحيح فوري.',
    bodyEn:
      'Select any surah and ayah range. Recite from memory while the app follows along word by word.',
    bodyAr:
      'اختر أي سورة ومجموعة آيات. اقرأ من حفظك والتطبيق يتابعك كلمة بكلمة.',
    illustrationIcon: 'microphone',
    isLastScreen: false,
  },
  {
    headingEn: 'Begin Your Journey',
    headingAr: 'ابدأ رحلتك',
    bodyEn:
      'Choose a surah to start reading. Your progress is saved automatically.',
    bodyAr: 'اختر سورة لتبدأ القراءة. يُحفظ تقدمك تلقائيًا.',
    illustrationIcon: 'rocket-launch',
    isLastScreen: true,
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
        {SCREENS.map((screen, index) => (
          <OnboardingScreen
            key={index}
            headingEn={screen.headingEn}
            headingAr={screen.headingAr}
            bodyEn={screen.bodyEn}
            bodyAr={screen.bodyAr}
            illustrationIcon={screen.illustrationIcon}
            isLastScreen={screen.isLastScreen}
            onGetStarted={screen.isLastScreen ? handleGetStarted : undefined}
          />
        ))}
      </ScrollView>

      {/* Page dots positioned at bottom */}
      <View style={styles.dotsContainer}>
        <OnboardingDots total={SCREENS.length} active={activeIndex} />
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

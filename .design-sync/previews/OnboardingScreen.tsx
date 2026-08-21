import React from 'react';
import { OnboardingScreen } from 'alfurqan';

const noop = () => {};

export function WelcomeSlide() {
  return (
    <OnboardingScreen
      heading="شريكك الرقمي في الحفظ"
      body="تدرّب على حفظ القرآن في أي وقت ومكان - تصحيح فوري كالمعلم الحقيقي"
      illustrationIcon=""
      isFirstScreen
      isLastScreen={false}
      screenIndex={0}
      totalScreens={3}
      onNext={noop}
    />
  );
}

export function ListenSlide() {
  return (
    <OnboardingScreen
      heading="اقرأ. نسمع. تصحيح فوري."
      body="اختر أي سورة ومجموعة آيات. اقرأ من حفظك والتطبيق يتابعك كلمة بكلمة."
      illustrationIcon="microphone"
      isLastScreen={false}
      screenIndex={1}
      totalScreens={3}
      onNext={noop}
    />
  );
}

export function GetStartedSlide() {
  return (
    <OnboardingScreen
      heading="ابدأ رحلتك"
      body="اختر سورة لتبدأ القراءة. يُحفظ تقدمك تلقائيًا."
      illustrationIcon="rocket-launch"
      isLastScreen
      screenIndex={2}
      totalScreens={3}
      onGetStarted={noop}
    />
  );
}

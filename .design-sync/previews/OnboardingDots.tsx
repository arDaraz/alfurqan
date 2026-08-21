import React from 'react';
import { View } from 'react-native';
import { OnboardingDots } from 'alfurqan';

const FRAME = {
  width: 380,
  backgroundColor: '#F5EEDB',
  paddingVertical: 24,
  alignItems: 'center',
} as const;

export function FirstStep() {
  return (
    <View style={FRAME}>
      <OnboardingDots total={3} active={0} />
    </View>
  );
}

export function MiddleStep() {
  return (
    <View style={FRAME}>
      <OnboardingDots total={3} active={1} />
    </View>
  );
}

export function LastStep() {
  return (
    <View style={FRAME}>
      <OnboardingDots total={3} active={2} />
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { SplashView } from 'alfurqan';

export function PhoneFrame() {
  return (
    <View style={{ width: 390, height: 640 }}>
      <SplashView />
    </View>
  );
}

export function CompactPhone() {
  return (
    <View style={{ width: 320, height: 568 }}>
      <SplashView />
    </View>
  );
}

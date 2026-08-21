import React from 'react';
import { View } from 'react-native';
import { HomeView } from 'alfurqan';

// A whole screen needs a phone frame, kept under the capture viewport so the
// paper does not run off the card.
export function Screen() {
  return (
    <View style={{ width: 390, height: 600, backgroundColor: '#F5EEDB', overflow: 'hidden' }}>
      <HomeView />
    </View>
  );
}

export function SmallPhone() {
  return (
    <View style={{ width: 340, height: 600, backgroundColor: '#F5EEDB', overflow: 'hidden' }}>
      <HomeView />
    </View>
  );
}

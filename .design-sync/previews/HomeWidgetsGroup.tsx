import React from 'react';
import { View } from 'react-native';
import { HomeWidgetsGroup } from 'alfurqan';

export function Default() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB', paddingHorizontal: 16, paddingBottom: 16 }}>
      <HomeWidgetsGroup />
    </View>
  );
}

export function NarrowPhone() {
  return (
    <View style={{ width: 320, backgroundColor: '#F5EEDB', paddingHorizontal: 12, paddingBottom: 16 }}>
      <HomeWidgetsGroup />
    </View>
  );
}

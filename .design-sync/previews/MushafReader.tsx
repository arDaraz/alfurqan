import React from 'react';
import { View } from 'react-native';
import { MushafReader } from 'alfurqan';

export function WebFallback() {
  return (
    <View style={{ width: 390, height: 800, backgroundColor: '#F5EEDB' }}>
      <MushafReader initialPage={293} />
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { SearchScreen } from 'alfurqan';

const FRAME = { width: 390, height: 800, backgroundColor: '#EBE2C9' } as const;

export function Idle() {
  return (
    <View style={FRAME}>
      <SearchScreen />
    </View>
  );
}

export function Searched() {
  return (
    <View style={FRAME}>
      <SearchScreen initialQuery="الرحمن" />
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { BookmarksScreen } from 'alfurqan';

export function Empty() {
  return (
    <View style={{ width: 390, height: 800, backgroundColor: '#F5EEDB' }}>
      <BookmarksScreen />
    </View>
  );
}

export function CompactPhone() {
  return (
    <View style={{ width: 360, height: 640, backgroundColor: '#F5EEDB' }}>
      <BookmarksScreen />
    </View>
  );
}

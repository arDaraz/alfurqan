import React from 'react';
import { View } from 'react-native';
import { ReciterPickerSheet } from 'alfurqan';

const noop = () => {};

export function Open() {
  return (
    <View style={{ width: 390, height: 800, backgroundColor: '#F5EEDB' }}>
      <ReciterPickerSheet visible onClose={noop} />
    </View>
  );
}

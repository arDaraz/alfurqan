import React from 'react';
import { View } from 'react-native';
import { MushafLayoutPicker } from 'alfurqan';

const noop = () => {};

export function MadaniSelected() {
  return (
    <View style={{ width: 390, height: 640 }}>
      <MushafLayoutPicker
        visible
        value="madani-qcf-v2-hafs"
        onChange={noop}
        onDismiss={noop}
      />
    </View>
  );
}

export function IndoPakSelected() {
  return (
    <View style={{ width: 390, height: 640 }}>
      <MushafLayoutPicker
        visible
        value="indopak-15-line-hafs"
        onChange={noop}
        onDismiss={noop}
      />
    </View>
  );
}

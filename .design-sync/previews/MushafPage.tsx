import React from 'react';
import { View } from 'react-native';
import { MushafPage } from 'alfurqan';

const PHONE = { width: 390, height: 800, backgroundColor: '#F5EEDB' } as const;

export function ContentPackMissing() {
  return (
    <View style={PHONE}>
      <MushafPage pageNumber={293} layoutId="madani-qcf-v2-hafs" isActive />
    </View>
  );
}

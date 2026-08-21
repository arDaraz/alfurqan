import React from 'react';
import { View } from 'react-native';
import { KhatamWidget } from 'alfurqan';

const PAPER = { width: 380, backgroundColor: '#F5EEDB', padding: 12 } as const;

export function Midway() {
  return (
    <View style={PAPER}>
      <KhatamWidget juzReached={14} />
    </View>
  );
}

export function FirstJuz() {
  return (
    <View style={PAPER}>
      <KhatamWidget juzReached={1} />
    </View>
  );
}

export function NotStarted() {
  return (
    <View style={PAPER}>
      <KhatamWidget juzReached={0} />
    </View>
  );
}

export function Complete() {
  return (
    <View style={PAPER}>
      <KhatamWidget juzReached={30} />
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { ReaderHeader } from 'alfurqan';

const noop = () => {};

const FRAME = { width: 380, backgroundColor: '#F5EEDB' } as const;

export function Default() {
  return (
    <View style={FRAME}>
      <ReaderHeader surahName="الكهف" juzNumber={15} pageNumber={293} onMore={noop} />
    </View>
  );
}

export function YaSin() {
  return (
    <View style={FRAME}>
      <ReaderHeader surahName="يس" juzNumber={22} pageNumber={440} onMore={noop} />
    </View>
  );
}

export function BeforeSurahResolves() {
  return (
    <View style={FRAME}>
      <ReaderHeader surahName="" juzNumber={1} pageNumber={1} onMore={noop} />
    </View>
  );
}

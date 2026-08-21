import React from 'react';
import { View } from 'react-native';
import { ContinueReadingWidget, KhatamWidget, TasmeeWidget } from 'alfurqan';

const noop = () => {};

const PAPER = { width: 380, backgroundColor: '#F5EEDB', padding: 12 } as const;

export function Default() {
  return (
    <View style={PAPER}>
      <TasmeeWidget onPress={noop} />
    </View>
  );
}

export function BottomOfHome() {
  return (
    <View style={PAPER}>
      <View style={{ gap: 12 }}>
        <ContinueReadingWidget
          variant="resume"
          surahNumber={2}
          surahName="البقرة"
          ayahNumber={255}
          juzNumber={3}
          pageNumber={42}
          onPress={noop}
        />
        <KhatamWidget juzReached={3} />
        <TasmeeWidget onPress={noop} />
      </View>
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { ContinueReadingWidget } from 'alfurqan';

const noop = () => {};

const PAPER = { width: 380, backgroundColor: '#F5EEDB', padding: 12 } as const;

export function Resume() {
  return (
    <View style={PAPER}>
      <ContinueReadingWidget
        variant="resume"
        surahNumber={2}
        surahName="البقرة"
        ayahNumber={255}
        juzNumber={3}
        pageNumber={42}
        onPress={noop}
      />
    </View>
  );
}

export function FridayKahf() {
  return (
    <View style={PAPER}>
      <ContinueReadingWidget
        variant="resume"
        surahNumber={18}
        surahName="الكهف"
        ayahNumber={10}
        juzNumber={15}
        pageNumber={294}
        onPress={noop}
      />
    </View>
  );
}

export function Start() {
  return (
    <View style={PAPER}>
      <ContinueReadingWidget variant="start" onPress={noop} />
    </View>
  );
}

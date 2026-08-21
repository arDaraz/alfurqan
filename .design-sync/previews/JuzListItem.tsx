import React from 'react';
import { View } from 'react-native';
import { JuzListItem } from 'alfurqan';

const noop = () => {};

const PAPER = { width: 380, backgroundColor: '#F5EEDB', paddingVertical: 8 } as const;

// Only the surahs a juz starts at need a name here, the same subset
// SurahBrowser hands the list.
const SURAH_NAMES = new Map<number, string>([
  [1, 'الفاتحة'],
  [2, 'البقرة'],
  [3, 'آل عمران'],
  [67, 'الملك'],
  [78, 'النبأ'],
]);

const juzOne = { number: 1, startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 };
const juzTwo = { number: 2, startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 };
const juzThree = { number: 3, startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 };
const juzThirty = { number: 30, startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 };

export function Row() {
  return (
    <View style={PAPER}>
      <JuzListItem juz={juzOne} surahNames={SURAH_NAMES} onSelect={noop} onOpen={noop} />
    </View>
  );
}

export function Active() {
  return (
    <View style={PAPER}>
      <JuzListItem juz={juzThirty} surahNames={SURAH_NAMES} onSelect={noop} onOpen={noop} isActive />
    </View>
  );
}

export function List() {
  return (
    <View style={PAPER}>
      <JuzListItem juz={juzOne} surahNames={SURAH_NAMES} onSelect={noop} onOpen={noop} />
      <JuzListItem juz={juzTwo} surahNames={SURAH_NAMES} onSelect={noop} onOpen={noop} isActive />
      <JuzListItem juz={juzThree} surahNames={SURAH_NAMES} onSelect={noop} onOpen={noop} />
    </View>
  );
}

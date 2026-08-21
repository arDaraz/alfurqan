import React from 'react';
import { View } from 'react-native';
import { SurahListItem } from 'alfurqan';

const noop = () => {};

const alFatiha = {
  number: 1,
  nameArabic: 'الفاتحة',
  nameEnglish: 'Al-Fatiha',
  ayahCount: 7,
  revelationType: 'Makki' as const,
  revelationOrder: 5,
  juzStart: 1,
};

const alBaqarah = {
  number: 2,
  nameArabic: 'البقرة',
  nameEnglish: 'Al-Baqarah',
  ayahCount: 286,
  revelationType: 'Madani' as const,
  revelationOrder: 87,
  juzStart: 1,
};

const yaSin = {
  number: 36,
  nameArabic: 'يس',
  nameEnglish: 'Ya-Sin',
  ayahCount: 83,
  revelationType: 'Makki' as const,
  revelationOrder: 41,
  juzStart: 22,
};

export function Row() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB' }}>
      <SurahListItem surah={alFatiha} onSelect={noop} onOpen={noop} />
    </View>
  );
}

export function Active() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB' }}>
      <SurahListItem surah={yaSin} onSelect={noop} onOpen={noop} isActive />
    </View>
  );
}

export function List() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB', paddingVertical: 8 }}>
      <SurahListItem surah={alFatiha} onSelect={noop} onOpen={noop} />
      <SurahListItem surah={alBaqarah} onSelect={noop} onOpen={noop} isActive />
      <SurahListItem surah={yaSin} onSelect={noop} onOpen={noop} />
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { MushafScreenLayout } from 'alfurqan';

const PHONE = { width: 390, height: 800, backgroundColor: '#F5EEDB' } as const;

const ERROR_MESSAGE = 'Failed to load surah';

const loadKahf = () =>
  Promise.resolve({
    page: 293,
    surahName: 'الكهف',
    location: { surahNumber: 18, ayahNumber: 1 },
  });

const loadForever = () => new Promise<never>(() => {});

const loadBrokenPack = () =>
  Promise.reject(new Error('The Madani content pack failed integrity checks'));

export function PageResolved() {
  return (
    <View style={PHONE}>
      <MushafScreenLayout loadInitialPage={loadKahf} errorMessage={ERROR_MESSAGE} />
    </View>
  );
}

export function Loading() {
  return (
    <View style={PHONE}>
      <MushafScreenLayout loadInitialPage={loadForever} errorMessage={ERROR_MESSAGE} />
    </View>
  );
}

export function LoadFailed() {
  return (
    <View style={PHONE}>
      <MushafScreenLayout loadInitialPage={loadBrokenPack} errorMessage={ERROR_MESSAGE} />
    </View>
  );
}

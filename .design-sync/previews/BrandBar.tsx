import React from 'react';
import { View } from 'react-native';
import { BrandBar, ContinueReadingWidget, KhatamWidget, QiblahWidget, StreakWidget } from 'alfurqan';

const noop = () => {};

const SCREEN = { width: 390, backgroundColor: '#F5EEDB', paddingTop: 8, paddingBottom: 14 } as const;

// Seven days, oldest first and today last, the way weekActivity() builds them.
const THIS_WEEK = [true, true, false, true, true, true, true];

export function OnPaper() {
  return (
    <View style={SCREEN}>
      <BrandBar />
    </View>
  );
}

export function AboveHome() {
  return (
    <View style={SCREEN}>
      <BrandBar />
      <View style={{ paddingHorizontal: 14, paddingTop: 8, gap: 12 }}>
        <View style={{ direction: 'rtl', flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
          <QiblahWidget point={{ latitude: 30.0444, longitude: 31.2357 }} style={{ flex: 1 }} />
          <StreakWidget days={12} longest={41} week={THIS_WEEK} style={{ flex: 1 }} />
        </View>
        <ContinueReadingWidget
          variant="resume"
          surahNumber={18}
          surahName="الكهف"
          ayahNumber={54}
          juzNumber={15}
          pageNumber={299}
          onPress={noop}
        />
        <KhatamWidget juzReached={15} />
      </View>
    </View>
  );
}

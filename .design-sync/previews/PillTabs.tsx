import React from 'react';
import { View } from 'react-native';
import { PillTabs } from 'alfurqan';

const noop = () => {};

const PAPER = { width: 380, backgroundColor: '#F5EEDB', padding: 12 } as const;

// SurahBrowser's two tabs, in the order it declares them.
const BROWSE_TABS = [
  { id: 'surah', label: 'السور' },
  { id: 'juz', label: 'الأجزاء' },
] as const;

// BookmarksScreen lists recitation first so it lands on the physical right in
// RTL. Counts stay in Latin digits: the chip draws in the Quran font, which
// turns an Arabic-Indic digit into an ayah-marker rosette too small to read.
const BOOKMARK_TABS = [
  { id: 'recitation', label: 'الحفظ', count: '9' },
  { id: 'reading', label: 'القراءة', count: '24' },
] as const;

export function BrowseTabs() {
  return (
    <View style={PAPER}>
      <PillTabs tabs={BROWSE_TABS} active="surah" onChange={noop} />
    </View>
  );
}

export function JuzSelected() {
  return (
    <View style={PAPER}>
      <PillTabs tabs={BROWSE_TABS} active="juz" onChange={noop} />
    </View>
  );
}

export function WithCounts() {
  return (
    <View style={PAPER}>
      <PillTabs tabs={BOOKMARK_TABS} active="recitation" onChange={noop} />
    </View>
  );
}

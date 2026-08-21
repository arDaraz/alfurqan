import React from 'react';
import { View } from 'react-native';
import { QiblahWidget, StreakWidget } from 'alfurqan';

const PAPER = { width: 380, backgroundColor: '#F5EEDB', padding: 12 } as const;

const CAIRO = { latitude: 30.0444, longitude: 31.2357 };
const ISTANBUL = { latitude: 41.0082, longitude: 28.9784 };
const JAKARTA = { latitude: -6.2088, longitude: 106.8456 };

// Seven days, oldest first and today last, the way weekActivity() builds them.
const THIS_WEEK = [true, true, false, true, true, true, true];

export function Cairo() {
  return (
    <View style={PAPER}>
      <QiblahWidget point={CAIRO} />
    </View>
  );
}

export function Istanbul() {
  return (
    <View style={PAPER}>
      <QiblahWidget point={ISTANBUL} />
    </View>
  );
}

export function Jakarta() {
  return (
    <View style={PAPER}>
      <QiblahWidget point={JAKARTA} />
    </View>
  );
}

export function BesideStreak() {
  return (
    <View style={PAPER}>
      {/* HomeView lays the pair out RTL, so the Qiblah dial sits on the right. */}
      <View style={{ direction: 'rtl', flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
        <QiblahWidget point={CAIRO} style={{ flex: 1 }} />
        <StreakWidget days={12} longest={41} week={THIS_WEEK} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

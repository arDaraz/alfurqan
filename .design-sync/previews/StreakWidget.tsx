import React from 'react';
import { View } from 'react-native';
import { KhatamWidget, StreakWidget } from 'alfurqan';

const PAPER = { width: 380, backgroundColor: '#F5EEDB', padding: 12 } as const;

// Seven days, oldest first and today last, the way weekActivity() builds them.
const THIS_WEEK = [true, true, false, true, true, true, true];
const FULL_WEEK = [true, true, true, true, true, true, true];
const NO_WEEK = [false, false, false, false, false, false, false];

export function Default() {
  return (
    <View style={PAPER}>
      <StreakWidget days={12} longest={41} week={THIS_WEEK} />
    </View>
  );
}

export function PerfectWeek() {
  return (
    <View style={PAPER}>
      <StreakWidget days={128} longest={128} week={FULL_WEEK} />
    </View>
  );
}

export function NewReader() {
  return (
    <View style={PAPER}>
      <StreakWidget days={0} longest={0} week={NO_WEEK} />
    </View>
  );
}

export function BesideKhatam() {
  return (
    <View style={PAPER}>
      <View style={{ gap: 12 }}>
        <StreakWidget days={7} longest={41} week={THIS_WEEK} />
        <KhatamWidget juzReached={14} />
      </View>
    </View>
  );
}

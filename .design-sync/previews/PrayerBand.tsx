import React from 'react';
import { View } from 'react-native';
import { PrayerBand } from 'alfurqan';

const PAPER = { width: 380, backgroundColor: '#F5EEDB', padding: 12 } as const;

// A fixed Friday in late August, built in local time so the 12-hour clock the
// band prints does not move with the capture machine's timezone.
const at = (hour: number, minute: number) => new Date(2026, 7, 21, hour, minute);

// Umm al-Qura times for Makkah, 21 August.
const MAKKAH = {
  fajr: at(4, 41),
  dhuhr: at(12, 22),
  asr: at(15, 47),
  maghrib: at(18, 44),
  isha: at(20, 14),
};

// Egyptian General Authority of Survey times for Cairo, same day.
const CAIRO = {
  fajr: at(4, 16),
  dhuhr: at(12, 56),
  asr: at(16, 32),
  maghrib: at(18, 53),
  isha: at(20, 15),
};

export function BeforeAsr() {
  return (
    <View style={PAPER}>
      <PrayerBand
        day={{ times: MAKKAH, current: 'dhuhr', next: { name: 'asr', at: MAKKAH.asr } }}
        city="مكة المكرمة"
        now={at(14, 15)}
      />
    </View>
  );
}

export function BeforeMaghrib() {
  return (
    <View style={PAPER}>
      <PrayerBand
        day={{ times: MAKKAH, current: 'asr', next: { name: 'maghrib', at: MAKKAH.maghrib } }}
        city="مكة المكرمة"
        now={at(18, 11)}
      />
    </View>
  );
}

export function BeforeFajr() {
  return (
    <View style={PAPER}>
      <PrayerBand
        day={{ times: CAIRO, current: null, next: { name: 'fajr', at: CAIRO.fajr } }}
        city="القاهرة"
        now={at(3, 5)}
      />
    </View>
  );
}

export function AfterIshaNoCity() {
  return (
    <View style={PAPER}>
      <PrayerBand
        day={{
          times: MAKKAH,
          current: 'isha',
          // After Isha the next prayer is tomorrow's Fajr, so the strip still
          // shows today's five and nothing in it is marked.
          next: { name: 'fajr', at: new Date(2026, 7, 22, 4, 41) },
        }}
        city={null}
        now={at(21, 30)}
      />
    </View>
  );
}

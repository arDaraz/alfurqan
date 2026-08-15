jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('expo-location', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  watchHeadingAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
}));

import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { KhatamWidget } from '../../../src/components/home/widgets/KhatamWidget';
import { PrayerBand } from '../../../src/components/home/widgets/PrayerBand';
import { QiblahWidget } from '../../../src/components/home/widgets/QiblahWidget';
import { StreakWidget } from '../../../src/components/home/widgets/StreakWidget';
import { computePrayerDay } from '../../../src/services/prayerTimes';
import { useSettingsStore } from '../../../src/stores/settingsStore';

const RIYADH = { latitude: 24.7136, longitude: 46.6753 };
const NOON = new Date(2026, 7, 15, 12, 0, 0);
const day = computePrayerDay(RIYADH, 'UmmAlQura', 'shafi', NOON);

describe('PrayerBand', () => {
  it('names the next prayer in Quranic script and its time in a numeral font', () => {
    useSettingsStore.setState({ language: 'ar', themeMode: 'light' });
    const { getAllByText } = render(<PrayerBand day={day} city="الرياض" now={NOON} />);

    // The name shows twice: as the headline and again in the five-prayer strip.
    const [headlineName] = getAllByText('العصر');
    expect(StyleSheet.flatten(headlineName.props.style)).toMatchObject({
      fontFamily: 'KFGQPC-Uthmani',
    });

    // The Clock Numerals Rule: KFGQPC wraps digits in ayah ornaments, so times use Amiri.
    getAllByText(/^[٠-٩]+:[٠-٩]+$/).forEach((node) => {
      expect(StyleSheet.flatten(node.props.style)).toMatchObject({ fontFamily: 'Amiri' });
    });
  });

  it('renders the English band with a meridiem and all five prayers', () => {
    useSettingsStore.setState({ language: 'en' });
    const { getByText, getAllByText } = render(
      <PrayerBand day={day} city="Riyadh" now={NOON} />
    );

    expect(getByText('Next prayer')).toBeTruthy();
    expect(getByText('Riyadh')).toBeTruthy();
    expect(getByText('PM')).toBeTruthy();
    ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((prayer) => {
      expect(getAllByText(prayer).length).toBeGreaterThan(0);
    });
  });

  it('hides the city line when no name was resolved', () => {
    useSettingsStore.setState({ language: 'en' });
    const { queryByText } = render(<PrayerBand day={day} city={null} now={NOON} />);
    expect(queryByText('Riyadh')).toBeNull();
  });
});

describe('QiblahWidget', () => {
  it('shows the bearing outside the dial, in a numeral font', () => {
    useSettingsStore.setState({ language: 'en' });
    const { getByText } = render(<QiblahWidget point={RIYADH} />);

    const bearing = getByText(/^\d+°$/);
    expect(StyleSheet.flatten(bearing.props.style)).toMatchObject({ fontFamily: 'Manrope' });
    expect(getByText('to the Kaaba')).toBeTruthy();
  });

  it('uses Arabic-Indic digits and Amiri in Arabic', () => {
    useSettingsStore.setState({ language: 'ar' });
    const { getByText } = render(<QiblahWidget point={RIYADH} />);

    const bearing = getByText(/^[٠-٩]+°$/);
    expect(StyleSheet.flatten(bearing.props.style)).toMatchObject({ fontFamily: 'Amiri' });
  });
});

describe('StreakWidget', () => {
  it('reads the count, the unit and the record', () => {
    useSettingsStore.setState({ language: 'en' });
    const { getByText } = render(
      <StreakWidget days={28} longest={41} week={[false, true, true, true, true, true, true]} />
    );

    expect(getByText('28')).toBeTruthy();
    expect(getByText('days')).toBeTruthy();
    expect(getByText('Longest 41')).toBeTruthy();
    expect(StyleSheet.flatten(getByText('28').props.style)).toMatchObject({
      fontFamily: 'Manrope',
    });
  });

  it('converts every number for Arabic', () => {
    useSettingsStore.setState({ language: 'ar' });
    const { getByText } = render(
      <StreakWidget days={28} longest={41} week={Array(7).fill(true)} />
    );

    expect(getByText('٢٨')).toBeTruthy();
    expect(getByText('أطول تتابع ٤١')).toBeTruthy();
  });
});

describe('KhatamWidget', () => {
  it('reports progress out of thirty juz', () => {
    useSettingsStore.setState({ language: 'en' });
    const { getByText } = render(<KhatamWidget juzReached={7} />);
    expect(getByText('Juz 7 of 30')).toBeTruthy();
  });

  it('clamps a juz beyond the mushaf', () => {
    useSettingsStore.setState({ language: 'en' });
    const { getByText } = render(<KhatamWidget juzReached={44} />);
    expect(getByText('Juz 30 of 30')).toBeTruthy();
  });

  it('reads zero before the reader has started', () => {
    useSettingsStore.setState({ language: 'ar' });
    const { getByText } = render(<KhatamWidget juzReached={0} />);
    expect(getByText('الجزء ٠ من ٣٠')).toBeTruthy();
  });
});

import {
  computePrayerDay,
  minutesUntil,
  qiblahBearing,
  PRAYER_ORDER,
} from '../../src/services/prayerTimes';
import { formatBearing, formatClock, formatCountdown } from '../../src/utils/clock';

// Riyadh, where the design mock is set.
const RIYADH = { latitude: 24.7136, longitude: 46.6753 };

function atLocalHour(hour: number, minute = 0): Date {
  return new Date(2026, 7, 15, hour, minute, 0);
}

describe('computePrayerDay', () => {
  it('returns all five prayers in ascending order', () => {
    const day = computePrayerDay(RIYADH, 'UmmAlQura', 'shafi', atLocalHour(9));
    const stamps = PRAYER_ORDER.map((name) => day.times[name].getTime());
    expect(stamps).toEqual([...stamps].sort((a, b) => a - b));
  });

  it('picks the first prayer still ahead of now', () => {
    const day = computePrayerDay(RIYADH, 'UmmAlQura', 'shafi', atLocalHour(9));
    expect(day.next.name).toBe('dhuhr');
    expect(day.current).toBe('fajr');
    expect(day.next.at.getTime()).toBeGreaterThan(atLocalHour(9).getTime());
  });

  it('has no current prayer before Fajr', () => {
    const day = computePrayerDay(RIYADH, 'UmmAlQura', 'shafi', atLocalHour(2));
    expect(day.next.name).toBe('fajr');
    expect(day.current).toBeNull();
  });

  it("rolls over to tomorrow's Fajr after Isha", () => {
    const now = atLocalHour(23, 30);
    const day = computePrayerDay(RIYADH, 'UmmAlQura', 'shafi', now);
    expect(day.next.name).toBe('fajr');
    expect(day.current).toBe('isha');
    expect(day.next.at.getTime()).toBeGreaterThan(now.getTime());
    expect(day.next.at.getDate()).toBe(16);
  });

  it('moves Asr later under the Hanafi madhab', () => {
    const at = atLocalHour(9);
    const shafi = computePrayerDay(RIYADH, 'UmmAlQura', 'shafi', at);
    const hanafi = computePrayerDay(RIYADH, 'UmmAlQura', 'hanafi', at);
    expect(hanafi.times.asr.getTime()).toBeGreaterThan(shafi.times.asr.getTime());
    expect(hanafi.times.dhuhr.getTime()).toBe(shafi.times.dhuhr.getTime());
  });
});

describe('qiblahBearing', () => {
  it('points roughly west-south-west from Riyadh', () => {
    expect(Math.round(qiblahBearing(RIYADH))).toBeGreaterThan(230);
    expect(Math.round(qiblahBearing(RIYADH))).toBeLessThan(260);
  });
});

describe('minutesUntil', () => {
  it('floors at zero once the time has passed', () => {
    expect(minutesUntil(atLocalHour(9), atLocalHour(10))).toBe(0);
    expect(minutesUntil(atLocalHour(10, 30), atLocalHour(9, 6))).toBe(84);
  });
});

describe('clock formatting', () => {
  it('renders 12-hour Latin times with a meridiem', () => {
    expect(formatClock(atLocalHour(16, 7), false)).toEqual({ time: '4:07', meridiem: 'PM' });
    expect(formatClock(atLocalHour(0, 5), false)).toEqual({ time: '12:05', meridiem: 'AM' });
  });

  it('renders Arabic-Indic digits with no meridiem', () => {
    expect(formatClock(atLocalHour(16, 7), true)).toEqual({ time: '٤:٠٧', meridiem: '' });
  });

  it('splits a countdown into hours and minutes', () => {
    expect(formatCountdown(84, false)).toMatchObject({ hoursText: '1', minutesText: '24' });
    expect(formatCountdown(84, true)).toMatchObject({ hoursText: '١', minutesText: '٢٤' });
    expect(formatCountdown(24, false)).toMatchObject({ hours: 0, minutesText: '24' });
  });

  it('rounds a bearing and keeps the degree sign', () => {
    expect(formatBearing(126.7, false)).toBe('127°');
    expect(formatBearing(126.7, true)).toBe('١٢٧°');
  });
});

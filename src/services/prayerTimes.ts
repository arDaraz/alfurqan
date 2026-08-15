import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
  type CalculationParameters,
} from 'adhan';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type MadhabId = 'shafi' | 'hanafi';

export const PRAYER_ORDER: readonly PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Subset of adhan's methods, keyed by the regions this app ships to. */
export const PRAYER_METHODS = {
  UmmAlQura: CalculationMethod.UmmAlQura,
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  Egyptian: CalculationMethod.Egyptian,
  Karachi: CalculationMethod.Karachi,
  Dubai: CalculationMethod.Dubai,
  Qatar: CalculationMethod.Qatar,
  Kuwait: CalculationMethod.Kuwait,
  Singapore: CalculationMethod.Singapore,
  Turkey: CalculationMethod.Turkey,
  NorthAmerica: CalculationMethod.NorthAmerica,
} as const;

export type PrayerMethodId = keyof typeof PRAYER_METHODS;

export const DEFAULT_PRAYER_METHOD: PrayerMethodId = 'UmmAlQura';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface PrayerDay {
  times: Record<PrayerName, Date>;
  /** The prayer whose time has most recently passed, or `null` before Fajr. */
  current: PrayerName | null;
  next: { name: PrayerName; at: Date };
}

function buildParams(method: PrayerMethodId, madhab: MadhabId): CalculationParameters {
  const params = PRAYER_METHODS[method]();
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

function readTimes(coords: Coordinates, params: CalculationParameters, date: Date) {
  const t = new PrayerTimes(coords, date, params);
  return { fajr: t.fajr, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
}

/**
 * Today's five prayers plus the next one. After Isha the next prayer is
 * tomorrow's Fajr, which adhan itself reports as `none`.
 */
export function computePrayerDay(
  point: GeoPoint,
  method: PrayerMethodId,
  madhab: MadhabId,
  now: Date = new Date()
): PrayerDay {
  const coords = new Coordinates(point.latitude, point.longitude);
  const params = buildParams(method, madhab);
  const times = readTimes(coords, params, now);

  const upcoming = PRAYER_ORDER.find((name) => times[name].getTime() > now.getTime());
  if (upcoming) {
    const index = PRAYER_ORDER.indexOf(upcoming);
    return {
      times,
      current: index === 0 ? null : PRAYER_ORDER[index - 1],
      next: { name: upcoming, at: times[upcoming] },
    };
  }

  const tomorrow = new Date(now.getTime() + 86_400_000);
  return {
    times,
    current: 'isha',
    next: { name: 'fajr', at: readTimes(coords, params, tomorrow).fajr },
  };
}

/** Great-circle bearing from the reader to the Kaaba, in degrees clockwise from true north. */
export function qiblahBearing(point: GeoPoint): number {
  return Qibla(new Coordinates(point.latitude, point.longitude));
}

/** Whole minutes until `at`, floored at zero so a passed time never reads negative. */
export function minutesUntil(at: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((at.getTime() - now.getTime()) / 60_000));
}

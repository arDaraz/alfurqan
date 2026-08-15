import { toArabicIndic } from './arabic';

/**
 * Clock times, bearings and counts never render in KFGQPC-Uthmani — it wraps
 * digits in ayah-marker ornaments. These helpers return plain digit strings so
 * the caller can set Amiri (Arabic-Indic) or Manrope (Latin) on them.
 */

export interface ClockParts {
  /** `4:07` or `٤:٠٧`, always 12-hour. */
  time: string;
  /** `AM` / `PM`. Empty in Arabic, where the design drops the meridiem. */
  meridiem: string;
}

export function formatClock(date: Date, isArabic: boolean): ClockParts {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours12}:${minutes}`;
  return {
    time: isArabic ? toArabicIndic12(time) : time,
    meridiem: isArabic ? '' : hours24 < 12 ? 'AM' : 'PM',
  };
}

function toArabicIndic12(time: string): string {
  return time.replace(/\d/g, (d) => toArabicIndic(Number(d)));
}

/** `1h 24m` / `٥٤m`-style countdown, split so the caller can style the digits. */
export function formatCountdown(
  totalMinutes: number,
  isArabic: boolean
): { hours: number; minutes: number; hoursText: string; minutesText: string } {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    hours,
    minutes,
    hoursText: isArabic ? toArabicIndic(hours) : String(hours),
    minutesText: isArabic ? toArabicIndic(minutes) : String(minutes),
  };
}

/** Bearing rounded to a whole degree with the degree sign attached. */
export function formatBearing(degrees: number, isArabic: boolean): string {
  const rounded = Math.round(degrees);
  return `${isArabic ? toArabicIndic(rounded) : rounded}°`;
}

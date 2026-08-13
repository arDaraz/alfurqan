import { toArabicIndic } from './arabic';

export function formatRelativeTime(
  nowMs: number,
  thenMs: number,
  language: 'ar' | 'en'
): string {
  const diff = Math.max(0, nowMs - thenMs);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (language === 'ar') {
    if (seconds < 60) return 'الآن';
    if (minutes < 60) return `منذ ${toArabicIndic(minutes)} د`;
    if (hours < 24) return `منذ ${toArabicIndic(hours)} س`;
    if (days === 1) return 'أمس';
    return `منذ ${toArabicIndic(days)} ي`;
  }

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

/**
 * Coarse-bucket variant used in places where a recency phrase is preferred to
 * a precise duration — e.g. bookmark cards showing "الأسبوع الماضي" / "Last week".
 * Buckets: just now / today / yesterday / this week / last week / weeks ago /
 *          a month ago / N months ago / a year ago / N years ago.
 */
export function formatRelativeBucket(
  thenMs: number,
  language: 'ar' | 'en',
  nowMs: number = Date.now()
): string {
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  const diff = Math.max(0, nowMs - thenMs);

  if (language === 'ar') {
    if (diff < HOUR) return 'قبل قليل';
    if (diff < DAY) return 'اليوم';
    if (diff < 2 * DAY) return 'أمس';
    if (diff < WEEK) return 'هذا الأسبوع';
    if (diff < 2 * WEEK) return 'الأسبوع الماضي';
    if (diff < MONTH) return 'منذ أسابيع';
    if (diff < 2 * MONTH) return 'منذ شهر';
    if (diff < YEAR) {
      const months = Math.floor(diff / MONTH);
      if (months === 2) return 'منذ شهرين';
      if (months <= 10) return `منذ ${toArabicIndic(months)} أشهر`;
      return 'منذ أشهر';
    }
    const years = Math.floor(diff / YEAR);
    if (years === 1) return 'منذ عام';
    if (years === 2) return 'منذ عامين';
    return `منذ ${toArabicIndic(years)} أعوام`;
  }

  if (diff < HOUR) return 'Just now';
  if (diff < DAY) return 'Today';
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < WEEK) return 'This week';
  if (diff < 2 * WEEK) return 'Last week';
  if (diff < MONTH) return 'Weeks ago';
  if (diff < 2 * MONTH) return 'A month ago';
  if (diff < YEAR) {
    const months = Math.floor(diff / MONTH);
    return `${months} months ago`;
  }
  const years = Math.floor(diff / YEAR);
  if (years === 1) return 'A year ago';
  return `${years} years ago`;
}

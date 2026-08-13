import { formatRelativeTime } from '../formatRelativeTime';

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const NOW = new Date('2026-04-29T12:00:00').getTime();

describe('formatRelativeTime', () => {
  it('formats English compact relative time', () => {
    expect(formatRelativeTime(NOW, NOW - 30_000, 'en')).toBe('just now');
    expect(formatRelativeTime(NOW, NOW - 5 * minute, 'en')).toBe('5m ago');
    expect(formatRelativeTime(NOW, NOW - 3 * hour, 'en')).toBe('3h ago');
    expect(formatRelativeTime(NOW, NOW - day, 'en')).toBe('yesterday');
    expect(formatRelativeTime(NOW, NOW - 4 * day, 'en')).toBe('4d ago');
  });

  it('formats Arabic compact relative time with Arabic-Indic digits', () => {
    expect(formatRelativeTime(NOW, NOW - 30_000, 'ar')).toBe('الآن');
    expect(formatRelativeTime(NOW, NOW - 5 * minute, 'ar')).toBe('منذ ٥ د');
    expect(formatRelativeTime(NOW, NOW - 3 * hour, 'ar')).toBe('منذ ٣ س');
    expect(formatRelativeTime(NOW, NOW - day, 'ar')).toBe('أمس');
    expect(formatRelativeTime(NOW, NOW - 4 * day, 'ar')).toBe('منذ ٤ ي');
  });
});

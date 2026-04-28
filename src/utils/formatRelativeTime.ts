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

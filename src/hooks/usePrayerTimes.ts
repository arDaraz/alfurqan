import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';

import { useSettingsStore, type PrayerLocation } from '../stores/settingsStore';
import { computePrayerDay, type PrayerDay } from '../services/prayerTimes';

/** Countdown only needs minute accuracy, so the clock re-reads twice a minute. */
const TICK_MS = 30_000;

export type PrayerStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'error';

export interface PrayerTimesResult {
  day: PrayerDay | null;
  location: PrayerLocation | null;
  status: PrayerStatus;
  /** Advances every 30s so callers recompute the countdown without their own timer. */
  now: Date;
}

async function resolveLocation(): Promise<PrayerLocation | null> {
  const position =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
  if (!position) return null;

  const { latitude, longitude } = position.coords;
  let city: string | null = null;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    city = place?.city ?? place?.subregion ?? place?.region ?? null;
  } catch {
    // A missing city name only costs the band its subtitle, never its times.
  }
  return { latitude, longitude, city };
}

/**
 * Prayer times for the reader's current position. The last resolved coordinates
 * are cached in settings, so the band renders immediately on a later launch and
 * keeps working with no signal.
 */
export function usePrayerTimes(enabled: boolean): PrayerTimesResult {
  const cached = useSettingsStore((s) => s.prayerLocation);
  const setPrayerLocation = useSettingsStore((s) => s.setPrayerLocation);
  const method = useSettingsStore((s) => s.prayerMethod);
  const madhab = useSettingsStore((s) => s.prayerMadhab);

  const [status, setStatus] = useState<PrayerStatus>(cached ? 'ready' : 'idle');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      setStatus(cached ? 'ready' : 'locating');
      try {
        const { status: permission } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (permission !== Location.PermissionStatus.GRANTED) {
          setStatus(cached ? 'ready' : 'denied');
          return;
        }
        const resolved = await resolveLocation();
        if (cancelled) return;
        if (resolved) setPrayerLocation(resolved);
        setStatus(resolved || cached ? 'ready' : 'error');
      } catch {
        // Cached coordinates keep the band alive when the location service fails.
        if (!cancelled) setStatus(cached ? 'ready' : 'error');
      }
    })();

    return () => {
      cancelled = true;
    };
    // `cached` is read as a fallback only; re-running on every write would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, setPrayerLocation]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, [enabled]);

  const day = useMemo(
    () => (cached ? computePrayerDay(cached, method, madhab, now) : null),
    [cached, method, madhab, now]
  );

  return { day, location: cached, status, now };
}

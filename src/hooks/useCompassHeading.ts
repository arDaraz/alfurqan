import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

/**
 * Device heading in degrees clockwise from true north, or `null` when no
 * magnetometer is reporting — the iOS Simulator, for one. A null heading means
 * the Qiblah dial should draw the bearing against a fixed north instead of
 * rotating with the phone.
 */
export function useCompassHeading(enabled: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (cancelled || status !== Location.PermissionStatus.GRANTED) return;
      try {
        subscription = await Location.watchHeadingAsync(({ trueHeading, magHeading }) => {
          // trueHeading is -1 until the device knows its declination.
          const value = trueHeading >= 0 ? trueHeading : magHeading;
          if (value >= 0) setHeading(value);
        });
      } catch {
        // No compass hardware. The dial falls back to a fixed north.
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  // Derived rather than cleared in the effect, so no render cascades when the
  // widget is switched off.
  return enabled ? heading : null;
}

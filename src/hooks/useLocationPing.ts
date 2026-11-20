import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { sendLocation, startBackgroundLocation, stopBackgroundLocation } from '../tasks/backgroundLocation';

/**
 * While online: starts background location (expo-task-manager) so pings continue
 * when the app is minimised. If background is not allowed or not supported
 * (Expo Go), falls back to foreground pings every ~10s.
 * Always returns the current position for the map.
 */
export function useLocationPing(enabled: boolean) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const sub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted || cancelled) return;
      const first = await Location.getLastKnownPositionAsync();
      if (first && !cancelled) setCoords({ lat: first.coords.latitude, lng: first.coords.longitude });

      const background = enabled ? await startBackgroundLocation() : false;
      if (!enabled) await stopBackgroundLocation();
      if (cancelled) return;

      sub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 25 },
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          // Background task already sends pings; only send here when it could not start.
          if (enabled && !background) {
            sendLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              heading: pos.coords.heading ?? null,
              speed: pos.coords.speed ?? null,
              recorded_at: pos.timestamp,
            });
          }
        },
      );
    })();
    return () => {
      cancelled = true;
      sub.current?.remove();
      sub.current = null;
    };
  }, [enabled]);

  return coords;
}

// Background location (expo-task-manager + expo-location).
// Keeps sending the driver's position while online, even when the app is minimised.
// This file must be imported once at start-up (index.ts) so the task is defined
// before Android/iOS wake the app for a location update.
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { http } from '../api/client';
import { config } from '../api/config';
import { locationQueue } from '../lib/db';
import { isOnline } from '../lib/network';

export const LOCATION_TASK = 'aolo-driver-location';

type Point = { lat: number; lng: number; heading: number | null; speed: number | null; recorded_at: number };

/** Sends one point, or saves it to SQLite if there is no internet. */
export async function sendLocation(p: Point) {
  if (config.useMock) return;
  if (!isOnline()) {
    locationQueue.add(p);
    return;
  }
  try {
    await http.post('/driver/location', { lat: p.lat, lng: p.lng, heading: p.heading, speed: p.speed });
  } catch {
    locationQueue.add(p);
  }
}

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  const last = data.locations[data.locations.length - 1];
  await sendLocation({
    lat: last.coords.latitude,
    lng: last.coords.longitude,
    heading: last.coords.heading ?? null,
    speed: last.coords.speed ?? null,
    recorded_at: last.timestamp,
  });
});

/** Returns true if background updates started; false if not allowed / not supported (e.g. Expo Go). */
export async function startBackgroundLocation(): Promise<boolean> {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (!fg.granted) return false;
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (!bg.granted) return false;
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) return true;
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10_000,
      distanceInterval: 25,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'AOLO Driver is online',
        notificationBody: 'Sharing your location to get ride requests.',
        notificationColor: '#101010',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopBackgroundLocation() {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
  } catch {
    /* not running */
  }
}

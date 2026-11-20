// Internet detection (@react-native-community/netinfo).
// - Tells React Query when we are offline, so it pauses and retries later.
// - Replays the SQLite outbox and queued location points when the connection returns.
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { create } from 'zustand';
import { http } from '../api/client';
import { config } from '../api/config';
import { locationQueue, outbox } from './db';

export const useNetwork = create<{ online: boolean }>(() => ({ online: true }));

export const isOnline = () => useNetwork.getState().online;

let started = false;
let flushing = false;

export function startNetworkWatcher() {
  if (started) return;
  started = true;
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      const wasOnline = useNetwork.getState().online;
      useNetwork.setState({ online });
      setOnline(online);
      if (online && !wasOnline) flushOffline();
    }),
  );
}

/** Sends everything that was saved while offline. Safe to call any time. */
export async function flushOffline() {
  if (flushing || config.useMock) return;
  flushing = true;
  try {
    // 1. Location points as one batch
    for (;;) {
      const pts = locationQueue.take(200);
      if (!pts.length) break;
      await http.post('/driver/location/batch', {
        points: pts.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          heading: p.heading,
          speed: p.speed,
          recorded_at: new Date(p.recorded_at).toISOString(),
        })),
      });
      locationQueue.removeUpTo(pts[pts.length - 1].id);
    }
    // 2. Queued actions in order
    for (const row of outbox.all()) {
      try {
        await http.request({ method: row.method, url: row.url, data: row.body ? JSON.parse(row.body) : undefined });
        outbox.remove(row.id);
      } catch (e: any) {
        // 4xx = server rejected it for good; drop after a few tries. Network errors stop the loop.
        if (e?.status >= 400 && e?.status < 500) {
          row.attempts >= 2 ? outbox.remove(row.id) : outbox.bump(row.id);
        } else break;
      }
    }
  } catch {
    // still offline / server down — try again on the next reconnect
  } finally {
    flushing = false;
  }
}

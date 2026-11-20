import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { eventsApi } from '../api/endpoints';
import { config } from '../api/config';
import { handleDriverEvent } from '../lib/events';
import { isOnline } from '../lib/network';

/**
 * Polls GET /driver/events?after=<last id> while the app is open.
 * Push notifications cover the background; this guarantees delivery in the foreground.
 */
export function useEventFeed(enabled: boolean) {
  const after = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || config.useMock) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      if (AppState.currentState !== 'active' || !isOnline()) return;
      try {
        const events = await eventsApi.since(after.current);
        for (const e of events) {
          handleDriverEvent(e.event as any, e.payload, e.id);
          after.current = e.id;
        }
      } catch {
        /* try again next tick */
      }
    };

    tick();
    timer = setInterval(tick, config.offerPollMs);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [enabled]);
}

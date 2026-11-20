// One place that reacts to server events (new ride, booking popup, lock, ...).
// Events arrive two ways, both using the same names and payloads:
//   1. Push notifications (expo-notifications) — works when the app is in the background.
//   2. Polling GET /driver/events while the app is open and the driver is online.
// See docs/API_CONTRACT.md §11.
import { navRef } from '../navigation/navRef';
import { useAuth } from '../store/auth';
import { useRide } from '../store/ride';
import type { AppLock, Booking, DocumentKey, RideOffer } from '../api/types';

export type DriverEvents = {
  'ride.offered': { offer: RideOffer };
  'booking.posted': { booking: Booking };
  'booking.taken': { booking_id: number };
  'ride.cancelled': { ride_id: number; reason: string };
  'bill.updated': { ride_id: number };
  'wallet.updated': Record<string, unknown>;
  'app.locked': { lock: AppLock };
  'app.unlocked': Record<string, unknown>;
  'document.expiring': { key: DocumentKey; label: string; ends_at: string };
};

const seen = new Set<string>();

/** `id` lets us ignore the same event arriving by push and by polling. */
export function handleDriverEvent<K extends keyof DriverEvents>(
  event: K,
  payload: DriverEvents[K],
  id?: string | number,
) {
  if (id !== undefined) {
    const k = String(id);
    if (seen.has(k)) return;
    seen.add(k);
  }
  const ready = navRef.isReady();
  const ride = useRide.getState();
  const auth = useAuth.getState();

  switch (event) {
    case 'ride.offered': {
      const { offer } = payload as DriverEvents['ride.offered'];
      if (ready && !ride.active && !ride.offer) navRef.navigate('RideRequest', { offer });
      break;
    }
    case 'booking.posted': {
      const { booking } = payload as DriverEvents['booking.posted'];
      const s = auth.driver?.popup_settings;
      const during = !!ride.active;
      if (!s?.show_popups) break;
      if (during && (!s.show_during_ride || booking.fit === 'conflict')) break;
      if (ready) navRef.navigate('BookingPopup', { booking, duringRide: during });
      break;
    }
    case 'ride.cancelled':
      ride.setActive(null);
      if (ready) navRef.navigate('Main');
      break;
    case 'wallet.updated':
      auth.refreshDriver();
      break;
    case 'app.locked': {
      const { lock } = payload as DriverEvents['app.locked'];
      // Never lock mid-ride: the lock starts after the ride ends (PDF p.42).
      if (ride.active)
        ride.setLockAfterRide('Your document has ended. Finish this ride. The app will lock when it ends.');
      auth.setDriver({ lock });
      break;
    }
    case 'app.unlocked':
      auth.setDriver({ lock: null });
      break;
    case 'document.expiring': {
      const { key, label, ends_at } = payload as DriverEvents['document.expiring'];
      if (ready) navRef.navigate('DocumentExpiring', { key, label, endsAt: ends_at });
      break;
    }
    // booking.taken / bill.updated: screens refetch on their own.
    default:
      break;
  }
}

import { create } from 'zustand';
import type { ActiveRide, Booking, RideOffer, TripCompleteSummary } from '../api/types';

interface RideState {
  /** Instant ride request currently on screen (city, parcel, etc.) */
  offer: RideOffer | null;
  /** Scheduled booking that popped up (idle or during a ride) */
  bookingPopup: Booking | null;
  active: ActiveRide | null;
  completed: TripCompleteSummary | null;
  /** Shown as a banner during a ride when a document has expired */
  lockAfterRide: string | null;
  setOffer: (o: RideOffer | null) => void;
  setBookingPopup: (b: Booking | null) => void;
  setActive: (r: ActiveRide | null) => void;
  patchActive: (r: Partial<ActiveRide>) => void;
  setCompleted: (s: TripCompleteSummary | null) => void;
  setLockAfterRide: (msg: string | null) => void;
}

export const useRide = create<RideState>((set, get) => ({
  offer: null,
  bookingPopup: null,
  active: null,
  completed: null,
  lockAfterRide: null,
  setOffer: (offer) => set({ offer }),
  setBookingPopup: (bookingPopup) => set({ bookingPopup }),
  setActive: (active) => set({ active }),
  patchActive: (r) => {
    const a = get().active;
    if (a) set({ active: { ...a, ...r } });
  },
  setCompleted: (completed) => set({ completed }),
  setLockAfterRide: (lockAfterRide) => set({ lockAfterRide }),
}));

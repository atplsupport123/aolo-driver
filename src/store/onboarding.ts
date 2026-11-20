// Holds the 6-step application form between screens so a driver can go
// back without losing what they typed. Each step is also saved to the API.
import { create } from 'zustand';
import type { DriverForm, OwnerForm, VehicleForm } from '../api/endpoints';
import type { DocumentKey, ServiceCategory } from '../api/types';

interface OnboardingState {
  owner: Partial<OwnerForm>;
  driver: Partial<DriverForm>;
  vehicle: Partial<VehicleForm>;
  categories: ServiceCategory[];
  uploaded: Partial<Record<DocumentKey, boolean>>;
  set: <K extends 'owner' | 'driver' | 'vehicle'>(k: K, v: Partial<OnboardingState[K]>) => void;
  setCategories: (c: ServiceCategory[]) => void;
  markUploaded: (k: DocumentKey) => void;
}

export const useOnboarding = create<OnboardingState>((set, get) => ({
  owner: {},
  driver: { is_owner_driver: false },
  vehicle: { vehicle_type: 'sedan', has_gps: true, has_dashcam: false },
  categories: ['city', 'local_8_80', 'outstation_oneway', 'outstation_round'],
  uploaded: {},
  set: (k, v) => set({ [k]: { ...(get()[k] as object), ...v } } as any),
  setCategories: (categories) => set({ categories }),
  markUploaded: (k) => set({ uploaded: { ...get().uploaded, [k]: true } }),
}));

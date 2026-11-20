import type { RideType, VehicleType } from '../api/types';

export const inr = (n: number | null | undefined, opts: { sign?: boolean } = {}) => {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(Math.round(n)).toLocaleString('en-IN');
  if (opts.sign) return `${n < 0 ? '-' : '+'}₹${abs}`;
  return `${n < 0 ? '-' : ''}₹${abs}`;
};

export const duration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

export const minutes = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m} min`;
};

export const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

export const rideTypeLabel: Record<RideType, string> = {
  city: 'City ride',
  outstation_oneway: 'Outstation One way',
  outstation_round: 'Outstation Round trip',
  rental: 'Rental',
  airport: 'Airport',
  parcel: 'Parcel',
};

export const rideTypeShort: Record<RideType, string> = {
  city: 'City',
  outstation_oneway: 'Outstation, one way',
  outstation_round: 'Outstation, round trip',
  rental: 'Rental',
  airport: 'Airport',
  parcel: 'Parcel',
};

export const vehicleLabels: { key: VehicleType; label: string }[] = [
  { key: 'hatchback', label: 'Hatchback' },
  { key: 'sedan', label: 'Sedan' },
  { key: 'suv', label: 'SUV' },
  { key: 'muv', label: 'MUV' },
  { key: 'auto', label: 'Auto' },
  { key: 'toto', label: 'Toto' },
  { key: 'bike', label: 'Bike' },
  { key: 'other', label: 'Other' },
];

export const vehicleLabel = (v: VehicleType) => vehicleLabels.find((x) => x.key === v)?.label ?? v;

export { date as formatDate } from '../lib/date';

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

// PDF p.13 — Ride types
import React from 'react';
import { Screen, Header, ToggleRow } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { driverApi } from '../../api/endpoints';
import type { RideType } from '../../api/types';

const TYPES: { key: RideType; title: string; sub: string }[] = [
  { key: 'city', title: 'City ride', sub: 'Pickup and drop inside the city' },
  { key: 'outstation_oneway', title: 'Outstation one way', sub: 'Drop the rider, return empty' },
  { key: 'outstation_round', title: 'Outstation round trip', sub: 'Multi-day, with return' },
  { key: 'rental', title: 'Rental', sub: 'Hourly and km packages' },
  { key: 'airport', title: 'Airport', sub: 'Airport pickup and drop' },
  { key: 'parcel', title: 'Parcel', sub: 'Send items with OTP delivery' },
];

export default function RideTypesScreen() {
  const { driver, setDriver } = useAuth();
  const current = driver?.ride_types;
  if (!current) return null;

  const toggle = (k: RideType, v: boolean) => {
    const next = { ...current, [k]: v };
    setDriver({ ride_types: next });
    driverApi.setRideTypes(next).catch(() => setDriver({ ride_types: current }));
  };

  return (
    <Screen>
      <Header title="Ride types" subtitle="Choose which requests you want to receive." />
      {TYPES.map((t) => (
        <ToggleRow
          key={t.key}
          title={t.title}
          subtitle={t.sub}
          value={!!current[t.key]}
          onChange={(v) => toggle(t.key, v)}
        />
      ))}
    </Screen>
  );
}

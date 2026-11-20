// Mock-mode only. Fires the events Laravel would push over the socket so
// every screen in the PDF can be reached without a backend.
import React from 'react';
import { View } from 'react-native';
import { Screen, Header, Button, SectionLabel } from '../../components/ui';
import { ridesApi, documentsApi } from '../../api/endpoints';
import { bookings } from '../../api/mock';
import { useAuth } from '../../store/auth';
import type { LockReason, RideType } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

const TYPES: RideType[] = ['city', 'outstation_oneway', 'outstation_round', 'rental', 'airport', 'parcel'];
const LOCKS: LockReason[] = ['wallet', 'insurance', 'puc', 'dl', 'fitness', 'permit'];

export default function DevToolsScreen({ navigation }: ScreenProps<'DevTools'>) {
  const refresh = useAuth((s) => s.refreshDriver);
  const lock = async (r: LockReason | null) => {
    documentsApi.mockLock(r);
    await refresh();
  };
  return (
    <Screen>
      <Header title="Developer tools" subtitle="Mock mode only. Simulates socket events from Laravel." />
      <SectionLabel>Ride requests</SectionLabel>
      <View style={{ gap: 8 }}>
        {TYPES.map((t) => (
          <Button
            key={t}
            small
            variant="soft"
            title={`Offer: ${t}`}
            onPress={() => navigation.navigate('RideRequest', { offer: ridesApi.mockOffer(t) })}
          />
        ))}
      </View>
      <SectionLabel>Bookings</SectionLabel>
      <View style={{ gap: 8 }}>
        <Button
          small
          variant="soft"
          title="Booking popup (idle)"
          onPress={() => navigation.navigate('BookingPopup', { booking: bookings[2] })}
        />
        <Button
          small
          variant="soft"
          title="Booking taken"
          onPress={() => navigation.navigate('BookingTaken', { booking: bookings[2] })}
        />
      </View>
      <SectionLabel>Documents and locks</SectionLabel>
      <View style={{ gap: 8 }}>
        <Button
          small
          variant="soft"
          title="Insurance ends tomorrow"
          onPress={() => navigation.navigate('DocumentExpiring', { key: 'insurance', label: 'Insurance' })}
        />
        {LOCKS.map((l) => (
          <Button key={l} small variant="soft" title={`Lock app: ${l}`} onPress={() => lock(l)} />
        ))}
        <Button small variant="outline" title="Unlock app" onPress={() => lock(null)} />
      </View>
    </Screen>
  );
}

// PDF p.36 (trip in progress), p.42 (document ended mid-ride banner)
import React, { useEffect, useRef } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import MapPanel from '../../components/MapPanel';
import { BottomSheet, NavInstruction, SosButton } from '../../components/ride';
import { Banner, Button, Stat } from '../../components/ui';
import { ridesApi, supportApi } from '../../api/endpoints';
import { bookings as mockBookings } from '../../api/mock';
import { config } from '../../api/config';
import { useAction } from '../../hooks/useApi';
import { useRide } from '../../store/ride';
import { colors, font } from '../../theme';
import { rideTypeShort } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function TripInProgressScreen({ navigation }: ScreenProps<'TripInProgress'>) {
  const { active: ride, setCompleted, lockAfterRide } = useRide();
  const complete = useAction(ridesApi.complete);

  // Mock: show a booking popup during the ride (PDF p.29).
  const fired = useRef(false);
  useEffect(() => {
    if (!config.useMock || fired.current) return;
    const t = setTimeout(() => {
      fired.current = true;
      navigation.navigate('BookingPopup', { booking: mockBookings[2], duringRide: true });
    }, 5000);
    return () => clearTimeout(t);
  }, [navigation]);

  if (!ride) return null;
  const needsExtras = ['outstation_oneway', 'outstation_round', 'airport'].includes(ride.type);

  const endTrip = async () => {
    if (needsExtras) return navigation.navigate('EndTripExtras');
    try {
      const summary = await complete.run(ride.id);
      setCompleted(summary);
      navigation.replace('TripComplete');
    } catch {
      /* shown */
    }
  };

  const sos = () =>
    Alert.alert('Send SOS?', 'AOLO support will get your live location right away.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: () => supportApi.sos(undefined, undefined, ride.id).catch(() => {}),
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <MapPanel pickup={ride.pickup} drop={ride.drop}>
        {ride.next_instruction && (
          <NavInstruction distanceKm={ride.next_instruction.distance_km} text={ride.next_instruction.text} />
        )}
        {lockAfterRide ? (
          <Banner text={lockAfterRide} style={{ position: 'absolute', top: 80, left: 12, right: 12 }} />
        ) : (
          <SosButton onPress={sos} />
        )}
      </MapPanel>
      <BottomSheet>
        <Text style={font.small}>{rideTypeShort[ride.type]} in progress · Drop</Text>
        <Text style={[font.h2, { marginTop: 2 }]}>{ride.drop?.name ?? 'Next stop'}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14 }}>
          <Stat label="Time left" value={`${ride.time_left_min ?? '—'} min`} />
          <Stat label="Distance left" value={`${ride.distance_left_km ?? '—'} km`} />
        </View>
        <Button title="End trip" onPress={endTrip} loading={complete.loading} />
        {!lockAfterRide && (
          <Pressable
            onPress={() => navigation.navigate('EmergencyHandover')}
            style={{ paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: colors.red, fontWeight: '700' }}>Emergency, cannot continue</Text>
          </Pressable>
        )}
      </BottomSheet>
    </View>
  );
}

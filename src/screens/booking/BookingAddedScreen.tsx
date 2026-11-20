// PDF p.30 — Booking added (to upcoming)
import React from 'react';
import { Text, View } from 'react-native';
import { Screen, Button, Card, H1, Muted } from '../../components/ui';
import { useRide } from '../../store/ride';
import { colors, font } from '../../theme';
import { rideTypeLabel } from '../../utils/format';
import { time } from '../../lib/date';
import type { ScreenProps } from '../../navigation/types';

export default function BookingAddedScreen({ navigation, route }: ScreenProps<'BookingAdded'>) {
  const { booking: b } = route.params;
  const active = useRide((s) => s.active);
  const starts = time(b.starts_at);

  return (
    <Screen
      footer={
        <>
          <Button title={active ? 'Back to ride' : 'Back to home'} onPress={() => navigation.goBack()} />
          <Button title="View upcoming bookings" variant="ghost" onPress={() => navigation.replace('Bookings')} />
        </>
      }
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.green,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 40,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>✓</Text>
      </View>
      <H1>Booking added</H1>
      <Muted style={{ fontSize: 14, marginTop: 6, marginBottom: 20 }}>
        {active ? `Finish your ${active.type === 'city' ? 'city ride' : 'current ride'} first. ` : ''}This{' '}
        {rideTypeLabel[b.type].toLowerCase()} is now in your upcoming bookings.
      </Muted>
      {active && (
        <Card style={{ marginBottom: 10 }}>
          <Text style={font.label}>Now</Text>
          <Text style={[font.h3, { marginTop: 4 }]}>Ride in progress</Text>
          {b.schedule && <Muted>Ends about {b.schedule.current_ride_ends}</Muted>}
        </Card>
      )}
      <Card>
        <Text style={font.label}>Report by</Text>
        <Text style={[font.h3, { marginTop: 4 }]}>
          {b.pickup.name}
          {b.schedule ? `, ${b.schedule.report_time}` : ''}
        </Text>
        <Muted>
          {rideTypeLabel[b.type]}, starts {starts}
        </Muted>
      </Card>
      {b.block_city_after && (
        <Muted style={{ marginTop: 14 }}>
          We will not offer you city rides that may end after {b.block_city_after}.
        </Muted>
      )}
    </Screen>
  );
}

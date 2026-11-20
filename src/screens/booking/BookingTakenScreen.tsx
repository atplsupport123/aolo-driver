// PDF p.33 — Booking just got taken
import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheet } from '../../components/ride';
import { Button, Banner, H2, Muted } from '../../components/ui';
import { colors } from '../../theme';
import { inr, rideTypeLabel } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function BookingTakenScreen({ navigation, route }: ScreenProps<'BookingTaken'>) {
  const { booking: b } = route.params;
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
      <BottomSheet>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.amberSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ fontWeight: '800', color: colors.amber, fontSize: 20 }}>!</Text>
        </View>
        <H2>Booking just got taken</H2>
        <Muted style={{ fontSize: 13, marginTop: 6 }}>
          Another driver pressed Accept before you. We will keep looking for the next booking for you.
        </Muted>
        <Banner
          tone="gray"
          text={`${rideTypeLabel[b.type]} · ${b.pickup.name} · ${inr(b.fare)}`}
          style={{ marginVertical: 14 }}
        />
        <Button title="OK" onPress={() => navigation.goBack()} />
        <Button
          title="See other bookings"
          variant="ghost"
          onPress={() => navigation.replace('Bookings')}
          style={{ marginBottom: 8 }}
        />
      </BottomSheet>
    </View>
  );
}

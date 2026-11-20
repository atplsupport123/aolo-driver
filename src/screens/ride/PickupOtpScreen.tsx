// PDF p.35 — at pickup, enter rider OTP to start
import React, { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import MapPanel from '../../components/MapPanel';
import { BottomSheet } from '../../components/ride';
import { Avatar, Button, OtpInput } from '../../components/ui';
import { ridesApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { useRide } from '../../store/ride';
import { colors, font } from '../../theme';
import { inr } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function PickupOtpScreen({ navigation }: ScreenProps<'PickupOtp'>) {
  const ride = useRide((s) => s.active);
  const setActive = useRide((s) => s.setActive);
  const [otp, setOtp] = useState('');
  const start = useAction(ridesApi.start);
  const cancel = useAction(ridesApi.cancel);

  if (!ride) return null;

  const onStart = async () => {
    try {
      const r = await start.run(ride.id, otp);
      setActive(r);
      navigation.replace(r.type === 'rental' ? 'RentalMode' : 'TripInProgress');
    } catch {
      /* shown */
    }
  };

  const onCancel = () =>
    Alert.alert('Cancel this ride?', 'Cancelling after you accept may bring a penalty.', [
      { text: 'Keep ride', style: 'cancel' },
      {
        text: 'Cancel ride',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancel.run(ride.id, 'driver_cancelled');
            setActive(null);
            navigation.navigate('Main');
          } catch {
            /* shown */
          }
        },
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <MapPanel pickup={ride.pickup} drop={ride.drop} />
      <BottomSheet>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar initials={ride.rider.initials} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>{ride.rider.name}</Text>
            <Text style={font.small}>
              Rating {ride.rider.rating} · {ride.payment === 'cash' ? 'Pays cash' : 'Paid online'} {inr(ride.fare)}
            </Text>
          </View>
          {/* Backend should return a masked/bridged number (e.g. Exotel) — never the rider's real number. */}
          <Button
            small
            variant="outline"
            title="Call"
            onPress={() =>
              ride.rider.masked_phone
                ? Linking.openURL(`tel:${ride.rider.masked_phone}`)
                : Alert.alert('Calling rider', 'Connecting through AOLO…')
            }
          />
        </View>
        <Text style={[font.small, { marginTop: 18, marginBottom: 10 }]}>
          Enter the 4 digit OTP from the rider to start the trip
        </Text>
        <OtpInput length={4} value={otp} onChange={setOtp} />
        {start.fieldErrors.otp ? (
          <Text style={{ color: colors.red, marginTop: 6 }}>{start.fieldErrors.otp}</Text>
        ) : null}
        <View style={{ marginTop: 18, gap: 4, marginBottom: 6 }}>
          <Button title="Start trip" disabled={otp.length !== 4} loading={start.loading} onPress={onStart} />
          <Button title="Cancel ride" variant="dangerText" onPress={onCancel} loading={cancel.loading} />
        </View>
      </BottomSheet>
    </View>
  );
}

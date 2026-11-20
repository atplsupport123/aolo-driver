// PDF p.38 — Cannot continue the trip
import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Screen, Header, Button, RadioRow, H3 } from '../../components/ui';
import { ridesApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { useRide } from '../../store/ride';
import { colors } from '../../theme';
import { SUPPORT_PHONE } from '../support/SupportScreen';
import type { ScreenProps } from '../../navigation/types';

const REASONS = [
  { key: 'medical', label: 'Medical emergency' },
  { key: 'accident', label: 'Accident or vehicle breakdown' },
  { key: 'safety', label: 'Safety threat' },
  { key: 'other', label: 'Other' },
];

export default function EmergencyHandoverScreen({ navigation }: ScreenProps<'EmergencyHandover'>) {
  const { active, setActive } = useRide();
  const [reason, setReason] = useState('medical');
  const api = useAction(ridesApi.emergency);

  const submit = async () => {
    if (!active) return;
    let lat: number | undefined, lng: number | undefined;
    try {
      const pos = await Location.getCurrentPositionAsync({});
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      /* send without location */
    }
    try {
      await api.run(active.id, reason, lat, lng);
      setActive(null);
      navigation.navigate('Main');
    } catch {
      /* shown */
    }
  };

  return (
    <Screen
      footer={
        <>
          <Button title="Request help and hand over ride" variant="danger" onPress={submit} loading={api.loading} />
          <Button title="Call AOLO support" variant="ghost" onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} />
        </>
      }
    >
      <Header
        backLabel="Back to trip"
        title="Cannot continue the trip"
        subtitle="Use this only in a real emergency. Stop your vehicle in a safe place first."
      />
      <H3 style={{ marginBottom: 8 }}>What happened?</H3>
      {REASONS.map((r) => (
        <RadioRow key={r.key} label={r.label} selected={reason === r.key} onPress={() => setReason(r.key)} />
      ))}
      <H3 style={{ marginTop: 16, marginBottom: 8 }}>What happens next</H3>
      {[
        'AOLO support is alerted with your live location.',
        'The rider is told and another driver is sent to them.',
        'You can go offline once support confirms. No penalty for a verified emergency.',
      ].map((t, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>{t}</Text>
        </View>
      ))}
    </Screen>
  );
}

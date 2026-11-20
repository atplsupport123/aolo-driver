// PDF p.41 — Action needed in 24 hours
import React from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheet } from '../../components/ride';
import { Banner, Button, H2, Muted, Pill } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { time } from '../../lib/date';
import type { ScreenProps } from '../../navigation/types';

export default function DocumentExpiringScreen({ navigation, route }: ScreenProps<'DocumentExpiring'>) {
  const { key, label, endsAt } = route.params;
  const vehicle = useAuth((s) => s.driver?.vehicle_number);
  const when = endsAt ? time(endsAt) : '';
  const isInsurance = key === 'insurance';

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} />
      <BottomSheet>
        <Pill text="Action needed in 24 hours" tone="amber" />
        <H2 style={{ marginTop: 10 }}>{label} ends tomorrow</H2>
        <Muted style={{ fontSize: 13, marginTop: 6, lineHeight: 19 }}>
          Renew in time. The moment it ends, the app locks and you cannot take rides. If you are on a ride, the lock
          starts after that ride.
        </Muted>
        <Banner
          tone="gray"
          text={`${vehicle} · ${label} ends tomorrow${when ? `, ${when}` : ''}`}
          style={{ marginTop: 12 }}
        />
        <Muted style={{ marginVertical: 10 }}>Same rule for PUC, driving licence, fitness and permit.</Muted>
        {isInsurance && <Button title="Insurance Now" onPress={() => navigation.replace('InsuranceNow')} />}
        <Button
          title="I will upload a new one"
          variant={isInsurance ? 'ghost' : 'primary'}
          onPress={() => navigation.replace('Documents')}
          style={{ marginBottom: 8, marginTop: 4 }}
        />
      </BottomSheet>
    </View>
  );
}

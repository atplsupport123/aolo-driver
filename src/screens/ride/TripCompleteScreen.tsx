// PDF p.37 — Trip complete, collect cash, rate rider
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, Button, KV, Muted, Banner } from '../../components/ui';
import { ridesApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { useRide } from '../../store/ride';
import { useAuth } from '../../store/auth';
import { colors, font } from '../../theme';
import { inr } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function TripCompleteScreen({ navigation }: ScreenProps<'TripComplete'>) {
  const { completed: c, active, setActive, setCompleted, lockAfterRide, setLockAfterRide } = useRide();
  const refresh = useAuth((s) => s.refreshDriver);
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const done = useAction(ridesApi.cashCollected);

  if (!c) return null;
  const cash = c.collect_amount > 0;

  const finish = async () => {
    try {
      if (rating) ridesApi.rateRider(c.ride_id, rating).catch(() => {});
      await done.run(c.ride_id);
      setActive(null);
      setCompleted(null);
      qc.invalidateQueries({ queryKey: ['home'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      if (lockAfterRide) {
        setLockAfterRide(null);
        await refresh();
      }
      navigation.navigate('Main');
    } catch {
      /* shown */
    }
  };

  return (
    <Screen footer={<Button title={cash ? 'Cash collected' : 'Done'} onPress={finish} loading={done.loading} />}>
      <Muted>Trip complete</Muted>
      <Text style={font.h2}>{cash ? 'Collect cash from rider' : 'Paid online'}</Text>
      <Text style={[font.money, { fontSize: 44, marginVertical: 10 }]}>{inr(cash ? c.collect_amount : c.fare)}</Text>
      <KV label="Trip fare" value={inr(c.fare)} />
      <KV label={`AOLO commission ${c.commission_pct}%`} value={inr(-c.commission)} />
      <KV label="Wallet balance after" value={inr(c.wallet_after)} />
      <Text style={[font.h3, { marginTop: 20, marginBottom: 10 }]}>Rate your rider</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: n <= rating ? colors.primary : colors.surface,
            }}
          >
            <Text style={{ fontWeight: '700', color: n <= rating ? '#fff' : colors.text }}>{n}</Text>
          </Pressable>
        ))}
      </View>
      {c.nearby_rides.count > 0 && (
        <Banner tone="gray" style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: '700' }}>{c.nearby_rides.count} rides waiting near the drop</Text>
          {c.nearby_rides.sample && (
            <Muted>
              {c.nearby_rides.sample.label} {inr(c.nearby_rides.sample.fare)}
            </Muted>
          )}
        </Banner>
      )}
      {active && lockAfterRide ? (
        <Banner
          text="Your app will lock after this screen until the document is renewed."
          tone="red"
          style={{ marginTop: 12 }}
        />
      ) : null}
    </Screen>
  );
}

// PDF p.27 (can take) and p.28 (cannot take) — booking detail with schedule check
import React from 'react';
import { Alert, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, Header, Button, Stat, KV, Card, Loading, Banner, Muted } from '../../components/ui';
import { PickupDrop } from '../../components/ride';
import { bookingsApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useAction } from '../../hooks/useApi';
import { colors, font } from '../../theme';
import { inr, rideTypeShort } from '../../utils/format';
import { time as formatTime } from '../../lib/date';
import type { ScreenProps } from '../../navigation/types';

export default function BookingDetailScreen({ navigation, route }: ScreenProps<'BookingDetail'>) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['booking', route.params.id], queryFn: () => bookingsApi.show(route.params.id) });
  const accept = useAction(bookingsApi.accept);
  const notify = useAction(bookingsApi.notifyWhenFree);
  const b = q.data;
  if (!b) return <Loading />;
  const can = b.fit !== 'conflict';
  const time = formatTime(b.starts_at);

  const onAccept = async () => {
    try {
      await accept.run(b.id);
      qc.invalidateQueries({ queryKey: ['bookings'] });
      navigation.replace('BookingAdded', { booking: b });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) navigation.replace('BookingTaken', { booking: b });
      else qc.invalidateQueries({ queryKey: ['booking', b.id] });
    }
  };

  return (
    <Screen
      footer={
        can ? (
          <>
            <Button title="Accept booking" onPress={onAccept} loading={accept.loading} />
            <Button title="Not now" variant="ghost" onPress={() => navigation.goBack()} />
          </>
        ) : (
          <>
            <Button title="Cannot accept" disabled />
            <Button
              title="Tell me if I become free"
              variant="outline"
              loading={notify.loading}
              onPress={async () => {
                try {
                  await notify.run(b.id);
                  Alert.alert('Done', 'We will tell you if this booking opens up for you.');
                  navigation.goBack();
                } catch {
                  /* shown */
                }
              }}
            />
          </>
        )
      }
    >
      <Header title={rideTypeShort[b.type]} />
      <Text style={[font.h3, { color: can ? colors.green : colors.red, marginTop: -8 }]}>
        {can ? 'You can take this booking' : 'You cannot take this booking'}
      </Text>
      <Card style={{ marginTop: 12 }}>
        <PickupDrop pickup={{ name: `${b.pickup.name} · ${time}` }} drop={b.drop} />
      </Card>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Stat label="Fare" value={inr(b.fare)} />
        <Stat label="Distance" value={b.distance_km ? `${b.distance_km} km` : '—'} />
        <Stat label="Your net" value={inr(b.net)} />
      </View>
      {b.schedule && (
        <Card style={{ marginTop: 12 }}>
          <Text style={[font.h3, { marginBottom: 4 }]}>Schedule check</Text>
          <KV label="Current ride ends" value={b.schedule.current_ride_ends} />
          <KV label="Earliest you reach pickup" value={b.schedule.earliest_at_pickup} />
          <KV label="Report time (30 min before)" value={b.schedule.report_time} />
          {can ? (
            <KV
              label="Spare time"
              value={`${b.spare_min} min`}
              valueColor={b.fit === 'tight' ? colors.amber : colors.green}
            />
          ) : (
            <KV
              label={`You would be late by ${b.late_by_min && b.late_by_min >= 60 ? `${Math.round(b.late_by_min / 60)} hr` : `${b.late_by_min} min`}`}
              value=""
              bold
            />
          )}
        </Card>
      )}
      {can ? (
        <Muted style={{ marginTop: 12, lineHeight: 18 }}>
          After you accept, we will not offer you city rides that may end after{' '}
          {b.block_city_after ?? 'the report time'}. Cancelling after you accept may bring a penalty.
        </Muted>
      ) : (
        <Banner
          tone="red"
          style={{ marginTop: 12 }}
          text="Your ride is running late, so you cannot reach pickup on time. If your ride ends sooner, we will tell you and this booking can open up again."
        />
      )}
    </Screen>
  );
}

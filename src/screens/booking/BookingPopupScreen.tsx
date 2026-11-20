// PDF p.29 (popup during a ride) and p.31 (popup while free).
// Stays 45s; if ignored it moves to the Bookings list. First to accept wins.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '../../components/ride';
import { Button, Pill, ProgressBar, Muted } from '../../components/ui';
import { fitText, fitTone } from '../../components/BookingCard';
import { bookingsApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useAction } from '../../hooks/useApi';
import { useCountdown } from '../../hooks/useCountdown';
import { colors, font } from '../../theme';
import { inr, rideTypeLabel } from '../../utils/format';
import { dayTime } from '../../lib/date';
import type { ScreenProps } from '../../navigation/types';

const POPUP_SECONDS = 45;

export default function BookingPopupScreen({ navigation, route }: ScreenProps<'BookingPopup'>) {
  const { booking: b, duringRide } = route.params;
  const qc = useQueryClient();
  const left = useCountdown(POPUP_SECONDS, () => navigation.goBack());
  const accept = useAction(bookingsApi.accept);
  const tone = fitTone(b);

  const onAccept = async () => {
    try {
      await accept.run(b.id);
      qc.invalidateQueries({ queryKey: ['bookings'] });
      navigation.replace('BookingAdded', { booking: b });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) navigation.replace('BookingTaken', { booking: b });
    }
  };

  if (duringRide) {
    // Compact card on top of the trip screen (p.29)
    return (
      <View style={{ flex: 1, paddingTop: 70, paddingHorizontal: 12 }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 14,
            elevation: 10,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 10,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={font.small}>New booking: {rideTypeLabel[b.type]}</Text>
            <Pill text={`NEW · ${left}s`} tone="green" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{b.title}</Text>
              <Text style={font.small}>{b.meta}</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800' }}>{inr(b.fare)}</Text>
          </View>
          <Text style={{ color: tone.fg, fontSize: 12, fontWeight: '700', marginVertical: 8 }}>
            {b.schedule ? `Your ride ends about ${b.schedule.current_ride_ends}. ` : ''}
            {fitText(b)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Accept" small style={{ flex: 1 }} onPress={onAccept} loading={accept.loading} />
            <Button title="Later" small variant="soft" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
          </View>
        </View>
        <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  // Full popup while free (p.31)
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
      <BottomSheet>
        <Muted>Looking for rides...</Muted>
        <ProgressBar value={left / POPUP_SECONDS} color={colors.primary} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <Pill text={rideTypeLabel[b.type]} tone="dark" />
          <Text style={font.small}>Pays cash</Text>
        </View>
        <Text style={[font.money, { marginTop: 6 }]}>{inr(b.fare)}</Text>
        <Muted>{b.meta}</Muted>
        <Text style={[font.h3, { marginTop: 10 }]}>{b.pickup.name}</Text>
        <Muted>Starts {dayTime(b.starts_at)}</Muted>
        <View style={{ backgroundColor: tone.bg, borderRadius: 6, padding: 8, marginTop: 10 }}>
          <Text style={{ color: tone.fg, fontWeight: '700' }}>
            {b.fit === 'conflict' ? fitText(b) : 'You are free. You can take this.'}
          </Text>
        </View>
        <Muted style={{ marginTop: 10, lineHeight: 18 }}>
          After you accept, the app changes to {rideTypeLabel[b.type].toLowerCase()} mode. If you do nothing for{' '}
          {POPUP_SECONDS} seconds, it moves to your Bookings list.
        </Muted>
        <View style={{ marginTop: 12, marginBottom: 8, gap: 4 }}>
          <Button
            title={`Accept ${left}s`}
            onPress={onAccept}
            loading={accept.loading}
            disabled={b.fit === 'conflict'}
          />
          <Button title="Not now" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </BottomSheet>
    </View>
  );
}

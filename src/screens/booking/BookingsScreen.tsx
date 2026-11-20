// PDF p.26 — Bookings (Open / My upcoming) with schedule fit
import React, { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Screen, Header, Segmented, Banner, Empty } from '../../components/ui';
import BookingCard from '../../components/BookingCard';
import { bookingsApi } from '../../api/endpoints';
import { useRide } from '../../store/ride';
import type { ScreenProps } from '../../navigation/types';

export default function BookingsScreen({ navigation }: ScreenProps<'Bookings'>) {
  const [tab, setTab] = useState<'open' | 'upcoming'>('open');
  const active = useRide((s) => s.active);
  const open = useQuery({ queryKey: ['bookings', 'open'], queryFn: () => bookingsApi.list({ tab: 'open' }) });
  const upcoming = useQuery({
    queryKey: ['bookings', 'upcoming'],
    queryFn: () => bookingsApi.list({ tab: 'upcoming' }),
  });
  const q = tab === 'open' ? open : upcoming;
  const endsAt = open.data?.[0]?.schedule?.current_ride_ends;

  return (
    <Screen scroll={false}>
      <Header title="Bookings" />
      <Segmented
        options={[
          { key: 'open', label: 'Open', badge: open.data?.length },
          { key: 'upcoming', label: 'My upcoming', badge: upcoming.data?.length },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'open' && (active || endsAt) ? (
        <Banner
          tone="gray"
          text={`Your current ride ends around ${endsAt ?? 'soon'}. We check each booking against this.`}
          style={{ marginTop: 12 }}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <FlashList
          contentContainerStyle={{ paddingTop: 12 }}
          data={q.data ?? []}
          keyExtractor={(b) => String(b.id)}
          renderItem={({ item }) => (
            <BookingCard
              b={item}
              showPosted={false}
              onPress={() => navigation.navigate('BookingDetail', { id: item.id })}
            />
          )}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} />}
          ListEmptyComponent={
            q.isLoading ? null : <Empty text={tab === 'open' ? 'No open bookings' : 'No upcoming bookings yet'} />
          }
        />
      </View>
    </Screen>
  );
}

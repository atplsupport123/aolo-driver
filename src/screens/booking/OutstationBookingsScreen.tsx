// PDF p.16 — Outstation bookings (live feed)
import React, { useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Screen, Header, ChipGroup, Banner, Empty } from '../../components/ui';
import BookingCard from '../../components/BookingCard';
import { bookingsApi } from '../../api/endpoints';
import { colors, font } from '../../theme';
import type { RideType } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

type Filter = 'all' | RideType;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'outstation_oneway', label: 'One way' },
  { key: 'outstation_round', label: 'Round trip' },
  { key: 'rental', label: 'Rental' },
  { key: 'airport', label: 'Airport' },
];

export default function OutstationBookingsScreen({ navigation }: ScreenProps<'OutstationBookings'>) {
  const [filter, setFilter] = useState<Filter>('all');
  const q = useQuery({
    queryKey: ['bookings', 'live', filter],
    queryFn: () => bookingsApi.list({ tab: 'live', type: filter }),
    refetchInterval: 20_000,
  });
  const fresh = q.data?.filter((b) => b.is_new).length ?? 0;

  return (
    <Screen scroll={false}>
      <Header title="Outstation bookings" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -10, marginBottom: 12 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green }} />
        <Text style={font.small}>Live · AOLO Cabs bookings · updated just now</Text>
      </View>
      <ChipGroup options={FILTERS} value={filter} onChange={setFilter} scroll />
      {fresh > 0 && <Banner tone="dark" text={`${fresh} new bookings just came in`} style={{ marginVertical: 12 }} />}
      <View style={{ flex: 1 }}>
        <FlashList
          contentContainerStyle={{ paddingTop: fresh ? 0 : 12 }}
          data={q.data ?? []}
          keyExtractor={(b) => String(b.id)}
          renderItem={({ item }) => (
            <BookingCard b={item} onPress={() => navigation.navigate('BookingDetail', { id: item.id })} />
          )}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} />}
          ListEmptyComponent={q.isLoading ? null : <Empty text="No bookings right now. Pull to refresh." />}
        />
      </View>
    </Screen>
  );
}

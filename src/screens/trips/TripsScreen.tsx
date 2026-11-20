// PDF p.55 — My trips (bottom tab)
import React, { useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { H1, ChipGroup, ListRow, Empty, Button } from '../../components/ui';
import { tripsApi } from '../../api/endpoints';
import { inr } from '../../utils/format';
import type { RideType } from '../../api/types';

type F = 'all' | RideType;
const FILTERS: { key: F; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'city', label: 'City' },
  { key: 'outstation_oneway', label: 'Outstation' },
  { key: 'rental', label: 'Rental' },
  { key: 'airport', label: 'Airport' },
];

export default function TripsScreen() {
  const nav = useNavigation();
  const [type, setType] = useState<F>('all');
  const q = useQuery({
    queryKey: ['trips', type, 'completed'],
    queryFn: () => tripsApi.list({ type, status: 'completed' }),
  });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <H1>My trips</H1>
        <Button small variant="soft" title="Full history" onPress={() => nav.navigate('RideHistory')} />
      </View>
      <ChipGroup options={FILTERS} value={type} onChange={setType} scroll />
      <View style={{ flex: 1 }}>
        <FlashList
          contentContainerStyle={{ paddingTop: 8 }}
          data={q.data ?? []}
          keyExtractor={(t) => String(t.id)}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} />}
          ListEmptyComponent={q.isLoading ? null : <Empty text="No trips yet" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={item.subtitle}
              right={<Text style={{ fontWeight: '800' }}>{inr(item.amount)}</Text>}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

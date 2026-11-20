// PDF p.56 — Ride History with filters and PDF report
import React, { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  Header,
  Segmented,
  ChipGroup,
  ListRow,
  Pill,
  Button,
  Muted,
  Empty,
  SectionLabel,
} from '../../components/ui';
import { tripsApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { inr } from '../../utils/format';
import type { RideType } from '../../api/types';

type Status = 'all' | 'completed' | 'cancelled_missed';
type Range = 'today' | 'week' | 'month' | 'all';
type T = 'all' | RideType;

export default function RideHistoryScreen() {
  const [status, setStatus] = useState<Status>('all');
  const [range, setRange] = useState<Range>('month');
  const [type, setType] = useState<T>('all');
  const [applied, setApplied] = useState({ range: 'month' as Range, type: 'all' as T });
  const [showFilter, setShowFilter] = useState(false);
  const q = useQuery({
    queryKey: ['history', status, applied],
    queryFn: () => tripsApi.list({ status, ...applied }),
  });
  const report = useAction(tripsApi.reportUrl);

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <Button
            title="Download PDF report"
            loading={report.loading}
            onPress={async () => {
              try {
                const { url } = await report.run({ status, ...applied });
                await Linking.openURL(url);
              } catch {
                /* shown */
              }
            }}
          />
          <Muted style={{ textAlign: 'center' }}>Report covers the rides shown by your filter</Muted>
        </>
      }
    >
      <Header title="Ride History" />
      <Segmented
        options={[
          { key: 'all', label: 'All' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled_missed', label: 'Cancelled / Missed' },
        ]}
        value={status}
        onChange={setStatus}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Muted>Showing {q.data?.length ?? 0} rides</Muted>
        <Button
          small
          variant="soft"
          title={showFilter ? 'Hide filter' : 'Filter records'}
          onPress={() => setShowFilter(!showFilter)}
        />
      </View>
      {showFilter && (
        <View style={{ marginTop: 8 }}>
          <SectionLabel style={{ marginTop: 0 }}>Period</SectionLabel>
          <ChipGroup<Range>
            options={[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This week' },
              { key: 'month', label: 'This month' },
              { key: 'all', label: 'All time' },
            ]}
            value={range}
            onChange={setRange}
          />
          <SectionLabel>Ride type</SectionLabel>
          <ChipGroup<T>
            options={[
              { key: 'all', label: 'All ride types' },
              { key: 'city', label: 'City' },
              { key: 'outstation_oneway', label: 'Outstation' },
              { key: 'rental', label: 'Rental' },
              { key: 'airport', label: 'Airport' },
              { key: 'parcel', label: 'Parcel' },
            ]}
            value={type}
            onChange={setType}
            scroll
          />
          <Button
            small
            title="Apply filter"
            style={{ marginTop: 10 }}
            onPress={() => {
              setApplied({ range, type });
              setShowFilter(false);
            }}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <FlashList
          contentContainerStyle={{ paddingTop: 8 }}
          data={q.data ?? []}
          keyExtractor={(t) => String(t.id)}
          ListEmptyComponent={q.isLoading ? null : <Empty text="No rides match this filter" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={`${item.subtitle} · ${item.code}`}
              onPress={() =>
                Alert.alert(item.code, `${item.title}\n${item.subtitle}\n${inr(item.amount)} · ${item.status}`)
              }
              right={
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontWeight: '800' }}>{inr(item.amount)}</Text>
                  <Pill
                    text={
                      item.status === 'completed' ? 'Completed' : item.status === 'cancelled' ? 'Cancelled' : 'Missed'
                    }
                    tone={item.status === 'completed' ? 'green' : item.status === 'cancelled' ? 'red' : 'amber'}
                  />
                </View>
              }
            />
          )}
        />
      </View>
    </Screen>
  );
}

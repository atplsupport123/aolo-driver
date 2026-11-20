// PDF p.54 — Earnings (Today / Week / Month)
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { H1, Segmented, KV, Muted } from '../../components/ui';
import { earningsApi } from '../../api/endpoints';
import { colors, font } from '../../theme';
import { inr } from '../../utils/format';
import type { Earnings } from '../../api/types';

const PERIOD_LABEL: Record<Earnings['period'], string> = { today: 'today', week: 'this week', month: 'this month' };

export default function EarningsScreen() {
  const [period, setPeriod] = useState<Earnings['period']>('today');
  const q = useQuery({ queryKey: ['earnings', period], queryFn: () => earningsApi.get(period) });
  const e = q.data;
  const max = Math.max(1, ...(e?.bars.map((b) => b.value) ?? [1]));
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon = 0

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} />}
      >
        <H1 style={{ marginBottom: 12 }}>Earnings</H1>
        <Segmented
          options={[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' },
          ]}
          value={period}
          onChange={setPeriod}
        />
        <Text style={[font.money, { marginTop: 18 }]}>{inr(e?.net)}</Text>
        <Muted>Net earnings {PERIOD_LABEL[period]}, after commission</Muted>

        {/* Simple bar chart: one bar per weekday, today's bar highlighted. */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8, marginTop: 20 }}>
          {e?.bars.map((b, i) => (
            <View key={b.label} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: '100%',
                  height: Math.max(4, (b.value / max) * 100),
                  backgroundColor: i === todayIdx ? colors.primary : colors.surfaceAlt,
                  borderRadius: 4,
                }}
              />
              <Text style={[font.tiny, { marginTop: 4 }]}>{b.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 20 }}>
          <KV label="Trips" value={String(e?.trips ?? '—')} />
          <KV label="Online time" value={e?.online_time ?? '—'} />
          <KV label="Gross fares" value={inr(e?.gross)} />
          <KV label="Commission (15%)" value={inr(e ? -e.commission : undefined)} />
          <KV label="City / Outstation / Parcel" value={e?.breakdown ?? '—'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

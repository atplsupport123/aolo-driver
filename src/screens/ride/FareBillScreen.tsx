// PDF p.53 — Fare bill with approval status
import React from 'react';
import { Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, Header, KV, Divider, StepList, SectionLabel, Button, Loading, Muted } from '../../components/ui';
import { ridesApi } from '../../api/endpoints';
import { useRide } from '../../store/ride';
import { colors, font } from '../../theme';
import { inr } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function FareBillScreen({ navigation, route }: ScreenProps<'FareBill'>) {
  const { rideId, bill: initial } = route.params;
  const { setActive, setCompleted } = useRide();
  const qc = useQueryClient();
  // Poll until the rider approves and AOLO finalises. The backend also pushes `bill.updated`.
  const q = useQuery({
    queryKey: ['bill', rideId],
    queryFn: () => ridesApi.bill(rideId),
    initialData: initial,
    refetchInterval: 15_000,
  });
  const bill = q.data;
  if (!bill) return <Loading />;
  const ready = bill.can_collect;

  return (
    <Screen
      footer={
        <Button
          title={ready ? `Collect ${inr(bill.total)}` : 'Waiting for approval'}
          disabled={!ready}
          onPress={async () => {
            await ridesApi.cashCollected(rideId).catch(() => {});
            setActive(null);
            setCompleted(null);
            qc.invalidateQueries({ queryKey: ['home'] });
            navigation.navigate('Main');
          }}
        />
      }
    >
      <Header title="Fare bill" subtitle={bill.title} back={false} />
      {bill.lines.map((l) => (
        <KV
          key={l.label}
          label={l.label}
          value={l.amount === null ? <Text style={{ color: colors.textMuted }}>{l.note}</Text> : inr(l.amount)}
        />
      ))}
      <Divider />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={font.h3}>Total so far</Text>
        <Text style={font.h2}>{inr(bill.total)}</Text>
      </View>
      <Muted style={{ marginTop: 4 }}>{bill.commission_note}</Muted>
      <SectionLabel>Status</SectionLabel>
      <StepList steps={bill.steps} />
    </Screen>
  );
}

// PDF p.60 — Penalty
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Header, Stat, SectionLabel, KV, ListRow, Loading } from '../../components/ui';
import { penaltyApi } from '../../api/endpoints';
import { colors } from '../../theme';
import { inr } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function PenaltyScreen({ navigation }: ScreenProps<'Penalty'>) {
  const q = useQuery({ queryKey: ['penalty'], queryFn: penaltyApi.get });
  const p = q.data;
  if (!p) return <Loading />;

  return (
    <Screen>
      <Header title="Penalty" subtitle="Penalties are deducted from your wallet." />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Stat label="This month" value={inr(p.month_total)} />
        <Stat label="Cancel rate" value={`${p.cancel_rate}%`} />
      </View>
      <SectionLabel>Penalty rules</SectionLabel>
      {p.rules.map((r) => (
        <KV key={r.label} label={r.label} value={r.amount} />
      ))}
      <Pressable onPress={() => navigation.navigate('PenaltyStructure')} style={{ paddingVertical: 8 }}>
        <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>Full penalty structure ›</Text>
      </Pressable>
      <SectionLabel>Recent penalties</SectionLabel>
      {p.recent.map((r) => (
        <ListRow
          key={r.id}
          title={r.title}
          subtitle={r.when}
          right={<Text style={{ fontWeight: '800', color: colors.red }}>{inr(r.amount)}</Text>}
        />
      ))}
    </Screen>
  );
}

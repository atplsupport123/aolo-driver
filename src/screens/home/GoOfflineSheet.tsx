// PDF p.14 — Go offline early?
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { BottomSheet } from '../../components/ride';
import { Banner, Button, H2, Muted, ProgressBar, RadioRow, Input } from '../../components/ui';
import { dutyApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { duration } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

type Reason = 'emergency' | 'vehicle' | 'health' | 'other';
const REASONS: { key: Reason; label: string }[] = [
  { key: 'emergency', label: 'Emergency' },
  { key: 'vehicle', label: 'Vehicle problem' },
  { key: 'health', label: 'Health problem' },
  { key: 'other', label: 'Other' },
];

export default function GoOfflineSheet({ navigation }: ScreenProps<'GoOffline'>) {
  const qc = useQueryClient();
  const home = useQuery({ queryKey: ['home'], queryFn: dutyApi.home });
  const [reason, setReason] = useState<Reason>('emergency');
  const [note, setNote] = useState('');
  const api = useAction(dutyApi.goOffline);
  const h = home.data;

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} />
      <BottomSheet>
        <H2>Go offline early?</H2>
        {h && (
          <>
            <Muted style={{ fontSize: 13, marginVertical: 6 }}>
              You have been online for {duration(h.online_seconds)}. The minimum online time is{' '}
              {h.min_online_seconds / 3600} hours, so {duration(h.min_online_seconds - h.online_seconds)} is left.
            </Muted>
            <ProgressBar value={h.online_seconds / h.min_online_seconds} />
          </>
        )}
        <Text style={{ fontWeight: '700', marginTop: 16, marginBottom: 8 }}>Why are you leaving?</Text>
        {REASONS.map((r) => (
          <RadioRow key={r.key} label={r.label} selected={reason === r.key} onPress={() => setReason(r.key)} />
        ))}
        {reason === 'other' && <Input placeholder="Tell us briefly" value={note} onChangeText={setNote} />}
        <Banner
          text="A penalty of [AMOUNT] may apply. Genuine emergencies are reviewed by AOLO support."
          style={{ marginVertical: 8 }}
        />
        <Button title="Stay online" onPress={() => navigation.goBack()} />
        <Button
          title="Go offline anyway"
          variant="dangerText"
          loading={api.loading}
          onPress={async () => {
            try {
              await api.run(reason, note || undefined);
              qc.invalidateQueries({ queryKey: ['home'] });
              navigation.goBack();
            } catch {
              /* shown */
            }
          }}
          style={{ marginBottom: 8 }}
        />
      </BottomSheet>
    </View>
  );
}

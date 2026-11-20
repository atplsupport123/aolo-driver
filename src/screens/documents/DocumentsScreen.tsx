// PDF p.40 — Documents (if any of these ends, the app locks)
import React, { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header, ListRow, Pill, Button } from '../../components/ui';
import { documentsApi } from '../../api/endpoints';
import { pickFile } from '../../hooks/usePickFile';
import { useAuth } from '../../store/auth';
import { formatDate } from '../../utils/format';
import type { DriverDocument } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

// Documents that lock the app on expiry (order from the PDF).
const WATCHED = ['insurance', 'puc', 'dl', 'fitness', 'permit', 'rc'];
const LABELS: Record<string, string> = {
  insurance: 'Insurance',
  puc: 'PUC certificate',
  dl: 'Driving licence',
  fitness: 'Fitness certificate',
  permit: 'Permit (commercial)',
  rc: 'RC',
};

export default function DocumentsScreen({ navigation }: ScreenProps<'Documents'>) {
  const qc = useQueryClient();
  const refresh = useAuth((s) => s.refreshDriver);
  const q = useQuery({ queryKey: ['documents'], queryFn: documentsApi.list });
  const [busy, setBusy] = useState<string | null>(null);

  const upload = async (d: DriverDocument) => {
    const files = await pickFile();
    if (!files?.length) return;
    setBusy(d.key);
    try {
      await documentsApi.upload(d.key, files);
      qc.invalidateQueries({ queryKey: ['documents'] });
      await refresh(); // backend may lift a lock once the new doc is approved
      Alert.alert('Uploaded', 'AOLO will check it shortly. You will get a message when it is approved.');
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setBusy(null);
    }
  };

  const docs = (q.data ?? [])
    .filter((d) => WATCHED.includes(d.key))
    .sort((a, b) => WATCHED.indexOf(a.key) - WATCHED.indexOf(b.key));

  const status = (d: DriverDocument) => {
    if (d.status === 'in_review') return <Pill text="In review" tone="amber" />;
    if (d.expiry_state === 'expired') return <Pill text="Expired" tone="red" />;
    if (d.expiry_state === 'expiring') return <Pill text="Ends tomorrow" tone="amber" />;
    return <Pill text={`Valid till ${formatDate(d.valid_till)}`} tone="green" />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} />}
      >
        <Header title="Documents" subtitle="If any of these ends, the app locks." />
        {docs.map((d) => (
          <ListRow
            key={d.key}
            title={LABELS[d.key] ?? d.label}
            subtitle={<View style={{ marginTop: 4 }}>{status(d)}</View>}
            right={
              busy === d.key ? (
                <ActivityIndicator />
              ) : (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {d.key === 'insurance' && d.expiry_state !== 'valid' && (
                    <Button
                      small
                      variant="outline"
                      title="Insurance Now"
                      onPress={() => navigation.navigate('InsuranceNow')}
                    />
                  )}
                  <Button small variant="outline" title="Upload" onPress={() => upload(d)} />
                </View>
              )
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

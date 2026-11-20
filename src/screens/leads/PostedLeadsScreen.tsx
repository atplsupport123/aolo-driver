// PDF p.18 — Posted leads
import React, { useState } from 'react';
import { Alert, RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, Header, Segmented, ChipGroup, Card, Pill, Button, Empty } from '../../components/ui';
import { leadsApi } from '../../api/endpoints';
import { font } from '../../theme';
import { vehicleLabel } from '../../utils/format';
import { colors } from '../../theme';
import type { Lead } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

type Kind = 'all' | Lead['kind'];

export default function PostedLeadsScreen({ navigation }: ScreenProps<'PostedLeads'>) {
  const qc = useQueryClient();
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [kind, setKind] = useState<Kind>('all');
  const q = useQuery({ queryKey: ['leads', scope, kind], queryFn: () => leadsApi.list(scope, kind) });
  const mine = useQuery({ queryKey: ['leads', 'mine', 'all'], queryFn: () => leadsApi.list('mine', 'all') });

  const contact = async (l: Lead) => {
    try {
      await leadsApi.contact(l.id);
      Alert.alert('Request sent', `${l.driver_name} will get your message in the app. Numbers stay hidden.`);
    } catch (e: any) {
      Alert.alert('Could not contact', e.message);
    }
  };
  const remove = (l: Lead) =>
    Alert.alert('Remove this lead?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await leadsApi.remove(l.id).catch(() => {});
          qc.invalidateQueries({ queryKey: ['leads'] });
        },
      },
    ]);

  return (
    <Screen scroll={false}>
      <Header
        title="Posted leads"
        right={
          <Button
            small
            title="+ New lead"
            onPress={() => navigation.navigate('CreateLead')}
            style={{ backgroundColor: colors.green }}
          />
        }
      />
      <Segmented
        options={[
          { key: 'all', label: 'All leads' },
          { key: 'mine', label: 'My leads', badge: mine.data?.length },
        ]}
        value={scope}
        onChange={setScope}
      />
      <View style={{ marginVertical: 12 }}>
        <ChipGroup<Kind>
          options={[
            { key: 'all', label: 'All' },
            { key: 'going_empty', label: 'Going empty' },
            { key: 'need_vehicle', label: 'Need vehicle' },
          ]}
          value={kind}
          onChange={setKind}
        />
      </View>
      <View style={{ flex: 1 }}>
        <FlashList
          data={q.data ?? []}
          keyExtractor={(l) => String(l.id)}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} />}
          ListEmptyComponent={q.isLoading ? null : <Empty text="No leads yet" />}
          renderItem={({ item: l }) => (
            <Card style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pill
                  text={l.kind === 'going_empty' ? 'Going empty' : 'Needs vehicle'}
                  tone={l.kind === 'going_empty' ? 'green' : 'amber'}
                />
                <Text style={font.small}>{l.posted_ago}</Text>
              </View>
              <Text style={[font.h3, { marginTop: 6 }]}>
                {l.from_city} to {l.to_city}
              </Text>
              <Text style={font.small}>
                {l.date}, {l.time} · {vehicleLabel(l.vehicle_type)}
                {l.fare ? ` · ₹${l.fare}` : ''}
              </Text>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}
              >
                <Text style={font.small}>
                  {l.driver_name} · Rating {l.driver_rating}
                </Text>
                {l.is_mine ? (
                  <Button small variant="outline" title="Remove" onPress={() => remove(l)} />
                ) : (
                  <Button small title="Contact in app" onPress={() => contact(l)} />
                )}
              </View>
            </Card>
          )}
        />
      </View>
    </Screen>
  );
}

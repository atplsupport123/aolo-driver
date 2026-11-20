// PDF p.57 — Wallet
import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Banner, Button, H1, ListRow, SectionLabel, Muted } from '../../components/ui';
import { walletApi } from '../../api/endpoints';
import { colors, font } from '../../theme';
import { inr } from '../../utils/format';

export default function WalletScreen() {
  const nav = useNavigation();
  const q = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
  const w = q.data;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} />}
      >
        <H1 style={{ marginBottom: 12 }}>Wallet</H1>
        <View style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 18 }}>
          <Text style={{ color: colors.darkMuted }}>Available balance</Text>
          <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', marginVertical: 4 }}>{inr(w?.balance)}</Text>
          <Text style={{ color: colors.darkMuted, fontSize: 12 }}>
            Starting balance {inr(w?.starting_balance)} · Commission {w?.commission_pct ?? 15}%
          </Text>
        </View>
        <Banner style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 13 }}>
            <Text style={{ fontWeight: '800' }}>Recharge within 6h. </Text>
            The app locks at 12h if the wallet stays low.
          </Text>
        </Banner>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Button title="Recharge" style={{ flex: 1 }} onPress={() => nav.navigate('Recharge')} />
          <Button title="Withdraw" variant="outline" style={{ flex: 1 }} onPress={() => nav.navigate('Withdraw')} />
        </View>
        <SectionLabel>Recent activity</SectionLabel>
        {w?.transactions.map((t) => (
          <ListRow
            key={t.id}
            title={t.title}
            subtitle={t.subtitle}
            right={
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: '800', color: t.amount < 0 ? colors.red : colors.green }}>
                  {inr(t.amount, { sign: true })}
                </Text>
                <Text style={font.tiny}>Bal. {inr(t.balance_after)}</Text>
              </View>
            }
          />
        ))}
        {w && !w.transactions.length && <Muted>No activity yet</Muted>}
      </ScrollView>
    </SafeAreaView>
  );
}

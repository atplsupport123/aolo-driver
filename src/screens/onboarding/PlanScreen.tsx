// PDF p.8 — Approved: Your plan + joining deposit
import React from 'react';
import { Linking, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Header, Button, Pill, Loading, Muted } from '../../components/ui';
import { onboardingApi, paymentsApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { useAuth } from '../../store/auth';
import { colors, font } from '../../theme';
import { inr } from '../../utils/format';

export default function PlanScreen() {
  const q = useQuery({ queryKey: ['plan'], queryFn: onboardingApi.plan });
  const setDriver = useAuth((s) => s.setDriver);
  const pay = useAction(async () => {
    const r = await onboardingApi.payDeposit();
    if (!r.paid && r.checkout_url && r.order_id) {
      await Linking.openURL(r.checkout_url);
      // Simple poll; replace with Razorpay SDK callback if Ravi uses it.
      for (let i = 0; i < 20; i++) {
        await new Promise((res) => setTimeout(res, 3000));
        if ((await paymentsApi.status(r.order_id)).paid) return true;
      }
      throw new Error('Payment not confirmed yet. If money was taken, it will reflect shortly.');
    }
    return r.paid;
  });

  if (!q.data) return <Loading />;
  const p = q.data;

  return (
    <Screen
      footer={
        <Button
          title="Pay deposit and start"
          loading={pay.loading}
          onPress={async () => {
            try {
              if (await pay.run()) setDriver({ onboarding_status: 'active' });
            } catch {
              /* shown */
            }
          }}
        />
      }
    >
      <Pill text="Approved" tone="dark" style={{ backgroundColor: colors.green }} />
      <Header back={false} title="Your plan" subtitle="Set by AOLO for your categories." />
      <View style={{ flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.primary }}>
        <Text style={[font.label, { flex: 1 }]}>Category</Text>
        <Text style={[font.label, { width: 60, textAlign: 'center' }]}>AOLO</Text>
        <Text style={[font.label, { width: 70, textAlign: 'right' }]}>You get</Text>
      </View>
      {p.rows.map((r) => (
        <View
          key={r.category}
          style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Text style={{ flex: 1 }}>{r.category}</Text>
          <Text style={{ width: 60, textAlign: 'center', fontWeight: '700' }}>{r.aolo_pct}%</Text>
          <Text style={{ width: 70, textAlign: 'right', fontWeight: '700' }}>{r.driver_pct}%</Text>
        </View>
      ))}
      <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 16, marginTop: 20 }}>
        <Muted>Joining deposit</Muted>
        <Text style={[font.money, { marginVertical: 4 }]}>{inr(p.deposit_amount)}</Text>
        <Muted>TDS or GST is deducted as per rules. Refund: {p.refund_condition}</Muted>
      </View>
    </Screen>
  );
}

// PDF p.58 — Recharge wallet
import React, { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, Header, Input, Chip, Banner, RadioRow, Button, SectionLabel, Muted } from '../../components/ui';
import { walletApi, paymentsApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { useAuth } from '../../store/auth';
import { colors, font } from '../../theme';
import { inr } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

type Method = 'upi' | 'card' | 'netbanking';

export default function RechargeScreen({ navigation, route }: ScreenProps<'Recharge'>) {
  const qc = useQueryClient();
  const refresh = useAuth((s) => s.refreshDriver);
  const w = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
  const [amount, setAmount] = useState(String(route.params?.amount ?? 1000));
  const [method, setMethod] = useState<Method>('upi');
  const n = Number(amount) || 0;

  const pay = useAction(async () => {
    const r = await walletApi.recharge(n, method);
    if (!r.paid && r.checkout_url && r.order_id) {
      await Linking.openURL(r.checkout_url);
      for (let i = 0; i < 20; i++) {
        await new Promise((res) => setTimeout(res, 3000));
        if ((await paymentsApi.status(r.order_id)).paid) return;
      }
      throw new Error('Payment not confirmed yet. If money was taken, your wallet will update shortly.');
    }
  });

  return (
    <Screen
      footer={
        <>
          <Button
            title={`Pay ${inr(n)}`}
            disabled={n < 100}
            loading={pay.loading}
            onPress={async () => {
              try {
                await pay.run();
                qc.invalidateQueries({ queryKey: ['wallet'] });
                qc.invalidateQueries({ queryKey: ['home'] });
                await refresh(); // clears a wallet lock if there was one
                Alert.alert('Wallet recharged', `${inr(n)} added.`);
                if (navigation.canGoBack()) navigation.goBack();
              } catch {
                /* shown */
              }
            }}
          />
          <Muted style={{ textAlign: 'center' }}>Wallet updates instantly after payment</Muted>
        </>
      }
    >
      <Header title="Recharge wallet" />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderRadius: 10,
          padding: 14,
        }}
      >
        <Text>Current balance</Text>
        <Text style={{ fontWeight: '800' }}>{inr(w.data?.balance)}</Text>
      </View>
      <SectionLabel>Amount</SectionLabel>
      <Input
        prefix="₹"
        keyboardType="number-pad"
        value={amount}
        onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
        inputStyle={{ fontSize: 22, fontWeight: '800' }}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[500, 1000, 2500].map((a) => (
          <Chip key={a} label={`+${inr(a)}`} selected={n === a} onPress={() => setAmount(String(a))} />
        ))}
      </View>
      <Banner
        tone="green"
        style={{ marginTop: 12 }}
        text="Recharge now to clear the 12 hour timer and keep the app active."
      />
      <Text style={[font.h3, { marginTop: 20, marginBottom: 8 }]}>Pay using</Text>
      <RadioRow
        label="UPI"
        sub="Google Pay, PhonePe, Paytm"
        selected={method === 'upi'}
        onPress={() => setMethod('upi')}
      />
      <RadioRow
        label="Debit or credit card"
        sub="Visa, Mastercard, RuPay"
        selected={method === 'card'}
        onPress={() => setMethod('card')}
      />
      <RadioRow
        label="Net banking"
        sub="All major banks"
        selected={method === 'netbanking'}
        onPress={() => setMethod('netbanking')}
      />
    </Screen>
  );
}

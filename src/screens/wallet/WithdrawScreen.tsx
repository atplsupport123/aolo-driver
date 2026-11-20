// PDF p.59 — Withdraw money
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, Header, Input, RadioRow, Button, H3, Muted, Loading } from '../../components/ui';
import { walletApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { colors } from '../../theme';
import { inr } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function WithdrawScreen({ navigation }: ScreenProps<'Withdraw'>) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
  const [amount, setAmount] = useState('1000');
  const [dest, setDest] = useState<'bank' | 'upi'>('bank');
  const api = useAction(walletApi.withdraw);
  const w = q.data;
  if (!w) return <Loading />;
  const n = Number(amount) || 0;
  const invalid = n < 100 || n > w.withdrawable;

  return (
    <Screen
      footer={
        <>
          <Button
            title={`Withdraw ${inr(n)}`}
            disabled={invalid}
            loading={api.loading}
            onPress={async () => {
              try {
                const r = await api.run(n, dest);
                qc.invalidateQueries({ queryKey: ['wallet'] });
                Alert.alert(
                  'Withdrawal requested',
                  `Reference ${r.reference}. Money reaches your account within 1 working day.`,
                );
                navigation.goBack();
              } catch {
                /* shown */
              }
            }}
          />
          <Muted style={{ textAlign: 'center' }}>Money reaches your account within 1 working day.</Muted>
        </>
      }
    >
      <Header title="Withdraw money" />
      <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 14 }}>
        <Muted>Withdrawable balance</Muted>
        <Text style={{ fontSize: 28, fontWeight: '800', marginVertical: 2 }}>{inr(w.withdrawable)}</Text>
        <Muted>{inr(w.min_balance)} stays in wallet to cover commission</Muted>
      </View>
      <View style={{ height: 16 }} />
      <Input
        label="Amount to withdraw"
        prefix="₹"
        keyboardType="number-pad"
        value={amount}
        onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
        error={n > w.withdrawable ? `You can withdraw up to ${inr(w.withdrawable)}` : api.fieldErrors.amount}
        inputStyle={{ fontSize: 20, fontWeight: '800' }}
      />
      <Muted style={{ marginTop: -6 }}>Minimum ₹100 · Maximum {inr(w.withdrawable)}</Muted>
      <H3 style={{ marginTop: 20, marginBottom: 8 }}>Send to</H3>
      {w.bank && (
        <RadioRow
          label="Bank account"
          sub={`${w.bank.bank_name}, account ending ${w.bank.last4}`}
          selected={dest === 'bank'}
          onPress={() => setDest('bank')}
        />
      )}
      {w.upi_id && <RadioRow label="UPI ID" sub={w.upi_id} selected={dest === 'upi'} onPress={() => setDest('upi')} />}
    </Screen>
  );
}

// PDF p.64 — Delete account
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Screen, Header, Banner, KV, Input, Button, Card } from '../../components/ui';
import { driverApi, walletApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { useAuth } from '../../store/auth';
import { useRide } from '../../store/ride';
import { inr } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function DeleteAccountScreen({ navigation }: ScreenProps<'DeleteAccount'>) {
  const [confirm, setConfirm] = useState('');
  const logout = useAuth((s) => s.logout);
  const active = useRide((s) => s.active);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
  const del = useAction(driverApi.deleteAccount);
  const blocked = !!active;

  return (
    <Screen
      footer={
        <>
          <Button
            title="Delete my account"
            variant="danger"
            disabled={confirm !== 'DELETE' || blocked}
            loading={del.loading}
            onPress={async () => {
              try {
                await del.run();
                await logout();
              } catch {
                /* shown */
              }
            }}
          />
          <Button title="Keep my account" variant="ghost" onPress={() => navigation.goBack()} />
        </>
      }
    >
      <Header title="Delete account" subtitle="This cannot be undone. Before you continue, please know:" />
      <Banner
        tone="red"
        text="Your profile, documents, trips and earnings history will be removed. Any unused wallet balance should be withdrawn first."
      />
      <Card style={{ marginVertical: 16 }}>
        <KV label="Wallet balance" value={inr(wallet.data?.balance)} />
        <KV label="Pending dues" value={inr(0)} />
        <KV label="Active ride" value={active ? 'In progress' : 'None'} />
      </Card>
      <Input label="Type DELETE to confirm" autoCapitalize="characters" value={confirm} onChangeText={setConfirm} />
    </Screen>
  );
}

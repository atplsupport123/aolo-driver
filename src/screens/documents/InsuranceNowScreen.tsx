// PDF p.44 — Insurance Now (request AOLO to arrange insurance)
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Screen, Header, Card, KV, RadioRow, Banner, Button, H3 } from '../../components/ui';
import { documentsApi, walletApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { useAuth } from '../../store/auth';
import { inr, vehicleLabel } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function InsuranceNowScreen({ navigation }: ScreenProps<'InsuranceNow'>) {
  const d = useAuth((s) => s.driver);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
  const [pay, setPay] = useState<'wallet' | 'self'>('wallet');
  const api = useAction(documentsApi.requestInsurance);
  if (!d) return null;

  return (
    <Screen
      footer={
        <Button
          title="Send request to AOLO"
          loading={api.loading}
          onPress={async () => {
            try {
              await api.run(pay);
              navigation.replace('InsuranceRequested');
            } catch {
              /* shown */
            }
          }}
        />
      }
    >
      <Header title="Insurance Now" subtitle="Send your request to AOLO. We will arrange your insurance at once." />
      <Card>
        <KV label="Vehicle" value={d.vehicle_number} />
        <KV label="Type" value={vehicleLabel(d.vehicle_type)} />
        <KV label="Year" value={String(d.vehicle_year ?? '—')} />
        <KV label="Owner" value={d.owner_name ?? d.name} />
      </Card>
      <H3 style={{ marginTop: 20, marginBottom: 8 }}>How will you pay?</H3>
      <RadioRow
        label="Pay from wallet"
        sub={`Balance ${inr(wallet.data?.balance)}`}
        selected={pay === 'wallet'}
        onPress={() => setPay('wallet')}
      />
      <RadioRow label="Pay myself" sub="UPI or cash to AOLO" selected={pay === 'self'} onPress={() => setPay('self')} />
      <Banner
        style={{ marginTop: 8 }}
        text="AOLO will tell you the cost and call you to confirm before anything is charged."
      />
    </Screen>
  );
}

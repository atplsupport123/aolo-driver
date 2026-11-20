// PDF p.61 — SLA Agreement
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Header, CheckRow, Button, H3 } from '../../components/ui';
import { legalApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { colors } from '../../theme';
import type { ScreenProps } from '../../navigation/types';

const SECTIONS = [
  { t: 'Commission', b: 'AOLO charges 15% commission on every ride. For cash rides it is deducted from your wallet.' },
  {
    t: 'Wallet and recharge',
    b: 'You get a starting balance. You get a reminder at 6 hours and the app locks at 12 hours if the wallet is not recharged.',
  },
  { t: 'Cancellations', b: 'Cancelling after accepting a ride can lead to a penalty as shown in the Penalty section.' },
  { t: 'Conduct', b: 'Be polite, follow the route, and never ask the rider for extra money.' },
  { t: 'Withdrawals', b: 'You can withdraw your earnings above the minimum wallet balance.' },
];

export default function SlaScreen({ navigation }: ScreenProps<'Sla'>) {
  const [agree, setAgree] = useState(false);
  const api = useAction(legalApi.acceptSla);
  return (
    <Screen
      footer={
        <>
          <CheckRow label="I have read and agree to this agreement" checked={agree} onPress={() => setAgree(!agree)} />
          <Button
            title="Accept"
            disabled={!agree}
            loading={api.loading}
            onPress={async () => {
              try {
                await api.run();
                navigation.goBack();
              } catch {
                /* shown */
              }
            }}
          />
        </>
      }
    >
      <Header title="SLA Agreement" subtitle="Between AOLO Cabs and the driver partner" />
      {SECTIONS.map((s, i) => (
        <View key={s.t} style={{ marginBottom: 16 }}>
          <H3>
            {i + 1}. {s.t}
          </H3>
          <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: 4 }}>{s.b}</Text>
        </View>
      ))}
    </Screen>
  );
}

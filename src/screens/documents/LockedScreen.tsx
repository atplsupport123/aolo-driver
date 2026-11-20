// PDF p.39 (wallet), p.43 (insurance), p.46–49 (PUC, DL, fitness, permit) — APP LOCKED
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Screen, Button, KV } from '../../components/ui';
import { documentsApi, walletApi } from '../../api/endpoints';
import { config } from '../../api/config';
import { useAuth } from '../../store/auth';
import { pickFile } from '../../hooks/usePickFile';
import { colors } from '../../theme';
import { inr } from '../../utils/format';
import type { DocumentKey, LockReason } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

const DOC: Record<
  Exclude<LockReason, 'wallet'>,
  { title: string; key: DocumentKey; body: string; short: string; upload: string }
> = {
  insurance: {
    title: 'Insurance expired',
    key: 'insurance',
    short: 'Insurance',
    body: 'You cannot go online until your vehicle has valid insurance.',
    upload: 'I already have it, upload',
  },
  puc: {
    title: 'PUC expired',
    key: 'puc',
    short: 'PUC',
    body: 'You cannot go online until your vehicle has a valid PUC certificate.',
    upload: 'Upload new PUC',
  },
  dl: {
    title: 'Driving licence expired',
    key: 'dl',
    short: 'Licence',
    body: 'You cannot go online until you upload a valid driving licence.',
    upload: 'Upload new driving licence',
  },
  fitness: {
    title: 'Fitness certificate expired',
    key: 'fitness',
    short: 'Fitness',
    body: 'You cannot go online until your vehicle has a valid fitness certificate.',
    upload: 'Upload new fitness certificate',
  },
  permit: {
    title: 'Permit expired',
    key: 'permit',
    short: 'Permit',
    body: 'You cannot go online until your vehicle has a valid commercial permit.',
    upload: 'Upload new permit',
  },
};

export default function LockedScreen({ navigation }: ScreenProps<'Locked'>) {
  const { driver, refreshDriver } = useAuth();
  const lock = driver?.lock;
  const [busy, setBusy] = useState(false);
  if (!lock) return null;

  const isWallet = lock.reason === 'wallet';
  const doc = !isWallet ? DOC[lock.reason as Exclude<LockReason, 'wallet'>] : null;

  const payUpi = async () => {
    setBusy(true);
    try {
      const r = await walletApi.recharge(lock.amount_due ?? 0, 'upi');
      if (r.paid) await refreshDriver();
      else navigation.navigate('Recharge', { amount: lock.amount_due });
    } catch (e: any) {
      Alert.alert('Payment failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    if (!doc) return;
    const files = await pickFile();
    if (!files?.length) return;
    setBusy(true);
    try {
      await documentsApi.upload(doc.key, files);
      Alert.alert('Uploaded', 'AOLO will check it. The app unlocks by itself once it is approved.');
      await refreshDriver();
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      dark
      footer={
        <>
          {isWallet ? (
            <Button title="Pay with UPI" variant="light" onPress={payUpi} loading={busy} />
          ) : lock.reason === 'insurance' ? (
            <>
              <Button title="Insurance Now" variant="light" onPress={() => navigation.navigate('InsuranceNow')} />
              <Button title={doc!.upload} variant="lightOutline" onPress={upload} loading={busy} />
            </>
          ) : (
            <Button title={doc!.upload} variant="light" onPress={upload} loading={busy} />
          )}
          <Button title="Contact support" variant="darkGhost" onPress={() => navigation.navigate('ContactUs')} />
          {config.useMock && (
            <Button
              title="Developer tools (mock)"
              variant="darkGhost"
              onPress={() => navigation.navigate('DevTools')}
            />
          )}
        </>
      }
    >
      <Text style={{ color: colors.darkMuted, letterSpacing: 2, fontSize: 12, marginTop: 24 }}>APP LOCKED</Text>
      <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 6 }}>
        {isWallet ? `Pay ${inr(lock.amount_due)} to continue` : doc!.title}
      </Text>
      <Text style={{ color: colors.darkMuted, fontSize: 14, marginTop: 10, lineHeight: 20 }}>
        {isWallet ? 'Your wallet was not recharged in 12 hours. Pay the amount used to unlock the app.' : doc!.body}
      </Text>
      <View style={{ backgroundColor: colors.darkCard, borderRadius: 10, padding: 14, marginTop: 20 }}>
        {isWallet ? (
          <>
            <KV dark label="Starting balance" value={inr(lock.starting_balance)} />
            <KV dark label="Used (commission)" value={inr(lock.used_commission)} />
            <KV dark label="Reminders sent" value={String(lock.reminders_sent ?? 0)} />
          </>
        ) : (
          <>
            <KV dark label="Vehicle" value={lock.vehicle_number ?? driver?.vehicle_number ?? ''} />
            <KV dark label={`${doc!.short} ended on`} value={lock.expired_on ?? '[DATE]'} />
            <KV dark label="Status" value="Expired" />
          </>
        )}
      </View>
    </Screen>
  );
}

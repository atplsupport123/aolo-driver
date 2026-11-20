// PDF p.45 — Request sent to AOLO
import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Screen, Button, H1, Muted, StepList } from '../../components/ui';
import { SUPPORT_PHONE } from '../support/SupportScreen';
import { colors } from '../../theme';
import type { ScreenProps } from '../../navigation/types';

export default function InsuranceRequestedScreen({ navigation }: ScreenProps<'InsuranceRequested'>) {
  return (
    <Screen
      footer={
        <>
          <Button title={`Call AOLO: ${SUPPORT_PHONE}`} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} />
          <Button title="Done" variant="ghost" onPress={() => navigation.goBack()} />
        </>
      }
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.green,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 32,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>✓</Text>
      </View>
      <H1>Request sent to AOLO</H1>
      <Muted style={{ fontSize: 14, marginTop: 6, marginBottom: 16 }}>
        Our team will call you shortly and arrange your insurance.
      </Muted>
      <StepList
        steps={[
          { label: 'Request sent', state: 'done' },
          { label: 'AOLO calls you', state: 'next' },
          { label: 'Insurance is issued', state: 'pending' },
          { label: 'App unlocks by itself', state: 'pending' },
        ]}
      />
    </Screen>
  );
}

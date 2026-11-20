// PDF p.62 — Privacy Policy
import React from 'react';
import { Text, View } from 'react-native';
import { Screen, Header, Button, H3 } from '../../components/ui';
import { legalApi } from '../../api/endpoints';
import { colors } from '../../theme';
import type { ScreenProps } from '../../navigation/types';

const SECTIONS = [
  {
    t: 'Information we collect',
    b: 'Your name, phone number, photo, vehicle details and documents (DL, RC, insurance, ID).',
  },
  {
    t: 'Location',
    b: 'We use your location while you are online and during trips, so riders can be matched and can see you coming.',
  },
  {
    t: 'How we use it',
    b: 'To give you rides, calculate fares and commission, process payments and withdrawals, and keep trips safe.',
  },
  {
    t: 'What riders can see',
    b: 'Only your name, photo, rating, vehicle and live location during a trip. Your phone number stays masked.',
  },
  { t: 'Sharing', b: 'We share data only with payment partners and when the law requires. We do not sell your data.' },
  { t: 'Your choices', b: 'You can update your details, or delete your account from the menu at any time.' },
  { t: 'Questions', b: 'Write to us from the Contact us screen.' },
];

export default function PrivacyScreen({ navigation }: ScreenProps<'Privacy'>) {
  return (
    <Screen
      footer={
        <Button
          title="I understand"
          onPress={() => {
            legalApi.acknowledgePrivacy().catch(() => {});
            navigation.goBack();
          }}
        />
      }
    >
      <Header title="Privacy Policy" subtitle="Last updated: [DATE]" />
      {SECTIONS.map((s) => (
        <View key={s.t} style={{ marginBottom: 16 }}>
          <H3>{s.t}</H3>
          <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: 4 }}>{s.b}</Text>
        </View>
      ))}
    </Screen>
  );
}

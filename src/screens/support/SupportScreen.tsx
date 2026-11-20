// PDF p.19 — Support and Help Center
import React from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Screen, Header, Card, IconCircle, ListRow, SectionLabel, Button, Muted } from '../../components/ui';
import { Phone, Mail, MessageCircle, LucideIcon } from 'lucide-react-native';
import { supportApi } from '../../api/endpoints';
import { useRide } from '../../store/ride';
import { font } from '../../theme';
import { colors } from '../../theme';
import type { ScreenProps } from '../../navigation/types';

export const SUPPORT_PHONE = '7050731000';
export const SUPPORT_EMAIL = 'supports@aolocabs.com';
export const SUPPORT_HOURS = '[HOURS]'; // TODO: AOLO to confirm

const TOPICS = [
  'Wallet and recharge',
  'Booking or ride problem',
  'Payment and withdrawal',
  'Account and documents',
  'Penalty or block',
];

export default function SupportScreen({ navigation }: ScreenProps<'Support'>) {
  const activeId = useRide((s) => s.active?.id);

  const sos = () =>
    Alert.alert('Emergency SOS', 'AOLO support will get your live location and call you right away.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: async () => {
          let lat: number | undefined, lng: number | undefined;
          try {
            const p = await Location.getCurrentPositionAsync({});
            lat = p.coords.latitude;
            lng = p.coords.longitude;
          } catch {
            /* ignore */
          }
          try {
            await supportApi.sos(lat, lng, activeId);
            Alert.alert('SOS sent', 'Help is on the way. Stay where you are if it is safe.');
          } catch {
            Linking.openURL(`tel:${SUPPORT_PHONE}`);
          }
        },
      },
    ]);

  const Contact = ({
    icon,
    title,
    sub,
    onPress,
  }: {
    icon: LucideIcon;
    title: string;
    sub: string;
    onPress: () => void;
  }) => (
    <Card
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
        backgroundColor: colors.surface,
        borderWidth: 0,
      }}
    >
      <IconCircle icon={icon} />
      <View>
        <Text style={font.h3}>{title}</Text>
        <Muted>{sub}</Muted>
      </View>
    </Card>
  );

  return (
    <Screen footer={<Button title="Emergency SOS" variant="danger" onPress={sos} />}>
      <Header title="Support and Help Center" />
      <Contact
        icon={Phone}
        title="Call support"
        sub={SUPPORT_PHONE}
        onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
      />
      <Contact
        icon={Mail}
        title="Email"
        sub={SUPPORT_EMAIL}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
      />
      <Contact
        icon={MessageCircle}
        title="Chat with us"
        sub="Replies in the app"
        onPress={() => navigation.navigate('ContactUs')}
      />
      <SectionLabel>Help with</SectionLabel>
      {TOPICS.map((t) => (
        <ListRow key={t} title={t} chevron onPress={() => navigation.navigate('ContactUs')} />
      ))}
      <Muted style={{ marginTop: 12 }}>Support hours: {SUPPORT_HOURS}</Muted>
    </Screen>
  );
}

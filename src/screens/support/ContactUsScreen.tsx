// PDF p.63 — Contact us
import React, { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { Screen, Header, Card, IconCircle, Input, Button, H3, Muted } from '../../components/ui';
import { Phone, Mail, MessageCircle, LucideIcon } from 'lucide-react-native';
import { supportApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { colors, font } from '../../theme';
import { SUPPORT_EMAIL, SUPPORT_HOURS, SUPPORT_PHONE } from './SupportScreen';

const WHATSAPP = ''; // TODO: AOLO WhatsApp number, e.g. '917050731000'

export default function ContactUsScreen() {
  const [msg, setMsg] = useState('');
  const api = useAction(supportApi.sendMessage);

  const Row = ({
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
    <Screen>
      <Header title="Contact us" subtitle="We are here to help, every day." />
      <Row
        icon={Phone}
        title="Call support"
        sub={SUPPORT_PHONE}
        onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
      />
      <Row
        icon={MessageCircle}
        title="WhatsApp"
        sub={WHATSAPP || '[WHATSAPP NUMBER]'}
        onPress={() => WHATSAPP && Linking.openURL(`https://wa.me/${WHATSAPP}`)}
      />
      <Row icon={Mail} title="Email" sub={SUPPORT_EMAIL} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      <Card style={{ marginTop: 8 }}>
        <Muted>Office</Muted>
        <Text style={{ fontWeight: '600', marginTop: 2 }}>
          AOLO Cabs, Arubs Technologies Private Limited{'\n'}Saharsa, Bihar
        </Text>
        <Muted style={{ marginTop: 10 }}>Support hours</Muted>
        <Text style={{ fontWeight: '600' }}>{SUPPORT_HOURS}</Text>
      </Card>
      <H3 style={{ marginTop: 20, marginBottom: 8 }}>Send us a message</H3>
      <Input
        placeholder="Write your problem here"
        multiline
        value={msg}
        onChangeText={setMsg}
        error={api.fieldErrors.message}
      />
      <Button
        title="Send message"
        disabled={!msg.trim()}
        loading={api.loading}
        onPress={async () => {
          try {
            const r = await api.run(msg.trim());
            setMsg('');
            Alert.alert('Message sent', `Ticket ${r.ticket_id}. We will reply in the app.`);
          } catch {
            /* shown */
          }
        }}
      />
    </Screen>
  );
}

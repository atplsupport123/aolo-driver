// PDF p.12 — side menu. A transparent modal that slides in from the left
// (react-native-reanimated) and closes on a left swipe (react-native-gesture-handler).
import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInLeft } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronRight } from 'lucide-react-native';
import { Avatar } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { driverApi } from '../../api/endpoints';
import { config } from '../../api/config';
import { useLang, useT } from '../../lib/i18n';
import { colors, font } from '../../theme';
import type { RootStackParamList, ScreenProps, TabParamList } from '../../navigation/types';

export default function MenuScreen({ navigation }: ScreenProps<'Menu'>) {
  const t = useT();
  const { lang, setLang } = useLang();
  const { driver, logout, setDriver } = useAuth();

  const close = () => navigation.goBack();
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -60) close();
    });

  const go = (screen: keyof RootStackParamList) => navigation.replace(screen as any);
  const tab = (screen: keyof TabParamList) => {
    navigation.goBack();
    navigation.navigate('Main', { screen });
  };

  const toggleLang = () => {
    const next = lang === 'hi' ? 'en' : 'hi';
    setLang(next);
    setDriver({ language: next });
    driverApi.setLanguage(next).catch(() => {});
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <GestureDetector gesture={swipe}>
        <Animated.View entering={SlideInLeft.duration(220)} style={{ width: '82%', backgroundColor: '#fff' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Avatar initials={driver?.initials ?? '—'} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={font.h2}>{driver?.name}</Text>
                  <Text style={font.small}>
                    Rating {driver?.rating} · {driver?.vehicle_number}
                  </Text>
                  <Pressable onPress={() => go('EditProfile')}>
                    <Text style={{ fontWeight: '700', marginTop: 2 }}>{t('menu.editProfile')}</Text>
                  </Pressable>
                </View>
              </View>

              <Item label={t('menu.home')} onPress={() => tab('Home')} />
              <Item label={t('menu.earnings')} onPress={() => tab('Earnings')} />
              <Item label={t('menu.wallet')} onPress={() => tab('WalletTab')} />
              <Item label={t('menu.history')} onPress={() => go('RideHistory')} />
              <Item label={t('menu.bookings')} onPress={() => go('Bookings')} />
              <Item label={t('menu.rideTypes')} onPress={() => go('RideTypes')} />
              <Item label={t('menu.documents')} onPress={() => go('Documents')} />
              <Item label={t('menu.support')} onPress={() => go('Support')} />
              <Item label={t('menu.language')} onPress={toggleLang} chevron={false} />

              <Text style={[font.label, { marginTop: 20, marginBottom: 4 }]}>{t('menu.settingsLegal')}</Text>
              <Item label={t('menu.penalty')} onPress={() => go('Penalty')} />
              <Item label={t('menu.popups')} onPress={() => go('BookingPopupSettings')} />
              <Item label={t('menu.sla')} onPress={() => go('Sla')} />
              <Item label={t('menu.privacy')} onPress={() => go('Privacy')} />
              <Item label={t('menu.contact')} onPress={() => go('ContactUs')} />

              <Text style={[font.label, { marginTop: 20, marginBottom: 4 }]}>{t('menu.session')}</Text>
              <Item
                label={t('menu.logout')}
                chevron={false}
                onPress={() =>
                  Alert.alert('Log out?', 'You will need an OTP to log in again.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log out', style: 'destructive', onPress: logout },
                  ])
                }
              />
              <Item label={t('menu.delete')} danger onPress={() => go('DeleteAccount')} />
              {config.useMock && <Item label="Developer tools (mock)" onPress={() => go('DevTools')} />}

              <Text style={[font.small, { marginTop: 24 }]}>AOLO Driver v1.0</Text>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <Pressable style={{ flex: 1 }} onPress={close} />
      </Animated.View>
    </View>
  );
}

function Item({
  label,
  onPress,
  danger,
  chevron = true,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  chevron?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11 }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: danger ? colors.red : colors.text,
          marginRight: 14,
        }}
      />
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: danger ? colors.red : colors.text }}>
        {label}
      </Text>
      {chevron && <ChevronRight size={18} color={colors.textFaint} />}
    </Pressable>
  );
}

// PDF p.10 (offline) and p.11 (online, looking for rides)
import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Menu, Route, Plus, Megaphone, CircleHelp, LucideIcon } from 'lucide-react-native';
import { useT } from '../../lib/i18n';
import MapPanel from '../../components/MapPanel';
import { BottomSheet } from '../../components/ride';
import { Banner, Button, Pill, ProgressBar, Stat } from '../../components/ui';
import { dutyApi, ridesApi } from '../../api/endpoints';
import { config } from '../../api/config';
import { useAction } from '../../hooks/useApi';
import { useLocationPing } from '../../hooks/useLocationPing';
import { useRide } from '../../store/ride';
import { colors, font, radius } from '../../theme';
import { duration, inr } from '../../utils/format';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const t = useT();
  const qc = useQueryClient();
  const home = useQuery({ queryKey: ['home'], queryFn: dutyApi.home, refetchInterval: 30_000 });
  const online = !!home.data?.is_online;
  const coords = useLocationPing(online);
  const setActive = useRide((s) => s.setActive);

  // Resume an in-progress ride after an app restart.
  useFocusEffect(
    React.useCallback(() => {
      ridesApi
        .active()
        .then((r) => {
          if (!r) return;
          setActive(r);
          if (r.status === 'accepted' || r.status === 'arrived') nav.navigate('PickupOtp');
          else if (r.status === 'started') nav.navigate(r.type === 'rental' ? 'RentalMode' : 'TripInProgress');
          else if (r.status === 'bill_submitted') nav.navigate('FareBill', { rideId: r.id });
        })
        .catch(() => {});
    }, [nav, setActive]),
  );

  const goOnline = useAction(async () => {
    const h = await dutyApi.goOnline(coords?.lat, coords?.lng);
    qc.setQueryData(['home'], h);
  });

  const goOffline = useAction(async () => {
    await dutyApi.goOffline();
    qc.invalidateQueries({ queryKey: ['home'] });
  });

  // Mock mode only: simulate a city ride request a few seconds after going online.
  const demoFired = useRef(false);
  useEffect(() => {
    if (!config.useMock || !online || demoFired.current) return;
    const t = setTimeout(() => {
      demoFired.current = true;
      if (!useRide.getState().active) nav.navigate('RideRequest', { offer: ridesApi.mockOffer('city') });
    }, 6000);
    return () => clearTimeout(t);
  }, [online, nav]);

  const h = home.data;
  const progress = h ? h.online_seconds / h.min_online_seconds : 0;
  const left = h ? Math.max(0, h.min_online_seconds - h.online_seconds) : 0;

  const onOfflinePress = () => {
    if (h && h.online_seconds < h.min_online_seconds) nav.navigate('GoOffline');
    else goOffline.fire();
  };

  return (
    <View style={{ flex: 1 }}>
      <MapPanel me={coords} pulse>
        <SafeAreaView edges={['top']} style={styles.top}>
          <Pressable style={styles.menuBtn} onPress={() => nav.navigate('Menu')}>
            <Menu size={20} color={colors.text} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={[styles.pill, { backgroundColor: colors.primary }]}
              onPress={() => nav.navigate('Main', { screen: 'WalletTab' })}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Wallet {inr(h?.wallet_balance)}</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => nav.navigate('Main', { screen: 'Earnings' })}>
              <Text style={{ fontWeight: '700' }}>{inr(h?.today_earnings)}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
        {!online && h?.demand_hint ? <Banner text={h.demand_hint} style={styles.demand} /> : null}
      </MapPanel>

      {!online ? (
        <View style={{ marginTop: -40 }}>
          <Pressable style={styles.go} onPress={goOnline.fire} disabled={goOnline.loading}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{goOnline.loading ? '…' : 'GO'}</Text>
          </Pressable>
          <BottomSheet style={{ paddingTop: 44 }}>
            <Text style={[font.h2, { textAlign: 'center' }]}>{t('home.offline')}</Text>
            <Text style={[font.small, { textAlign: 'center', marginTop: 2 }]}>{t('home.tapGo')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 16 }}>
              <Stat label={t('home.ridesToday')} value={h?.rides_today ?? '—'} />
              <Stat label={t('home.acceptance')} value={h ? `${h.acceptance_rate}%` : '—'} />
              <Stat label={t('home.rating')} value={h?.rating ?? '—'} />
            </View>
          </BottomSheet>
        </View>
      ) : (
        <BottomSheet>
          <Text style={font.h2}>{t('home.looking')}</Text>
          <Text style={[font.small, { marginTop: 2, marginBottom: 8 }]}>
            Online {duration(h!.online_seconds)} · {duration(left)} left of {h!.min_online_seconds / 3600} hr minimum
          </Text>
          <ProgressBar value={progress} />
          <View style={styles.grid}>
            <Tile
              dark
              title="Outstation Bookings"
              sub="Live updates"
              badge={h!.new_bookings_count ? `${h!.new_bookings_count} new` : undefined}
              onPress={() => nav.navigate('OutstationBookings')}
              icon={Route}
            />
            <Tile
              title="Create a Lead"
              sub="Empty return or need a car"
              onPress={() => nav.navigate('CreateLead')}
              icon={Plus}
            />
            <Tile
              title="Post a Lead"
              sub="Leads from drivers"
              onPress={() => nav.navigate('PostedLeads')}
              icon={Megaphone}
            />
            <Tile title="Support" sub="Help Center" onPress={() => nav.navigate('Support')} icon={CircleHelp} />
          </View>
          <Button
            title={t('home.goOfflineEarly')}
            variant="outline"
            onPress={onOfflinePress}
            loading={goOffline.loading}
            style={{ marginBottom: 12 }}
          />
        </BottomSheet>
      )}
    </View>
  );
}

function Tile({
  title,
  sub,
  onPress,
  dark,
  badge,
  icon: Icon,
}: {
  title: string;
  sub: string;
  onPress: () => void;
  dark?: boolean;
  badge?: string;
  icon: LucideIcon;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, dark && { backgroundColor: colors.primary }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Icon size={20} color={dark ? '#fff' : colors.text} />
        {badge ? <Pill text={badge} tone="green" /> : null}
      </View>
      <Text style={{ fontWeight: '700', marginTop: 10, color: dark ? '#fff' : colors.text }}>{title}</Text>
      <Text style={{ fontSize: 11, color: dark ? colors.darkMuted : colors.textMuted }}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pill: {
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 42,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  demand: { position: 'absolute', top: 110, left: 16, right: 16 },
  go: {
    alignSelf: 'center',
    marginBottom: -40,
    zIndex: 10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#fff',
    elevation: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 14 },
  tile: { width: '48.5%', backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 },
});

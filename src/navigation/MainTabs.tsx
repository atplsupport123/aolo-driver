import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, ChartColumn, Wallet, Menu, LucideIcon } from 'lucide-react-native';
import { useT } from '../lib/i18n';
import { colors } from '../theme';
import type { TabParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import EarningsScreen from '../screens/trips/EarningsScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import TripsScreen from '../screens/trips/TripsScreen';

const Tabs = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, LucideIcon> = {
  Home: House,
  Earnings: ChartColumn,
  WalletTab: Wallet,
  Trips: Menu,
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const labels: Record<keyof TabParamList, string> = {
    Home: t('tabs.home'),
    Earnings: t('tabs.earnings'),
    WalletTab: t('tabs.wallet'),
    Trips: t('tabs.trips'),
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: '#fff',
        paddingBottom: insets.bottom || 8,
        paddingTop: 8,
      }}
    >
      {state.routes.map((r, i) => {
        const on = state.index === i;
        const name = r.name as keyof TabParamList;
        const Icon = ICONS[name];
        return (
          <Pressable
            key={r.key}
            onPress={() => navigation.navigate(r.name)}
            style={{ flex: 1, alignItems: 'center', gap: 3 }}
          >
            <Icon size={22} color={on ? colors.text : colors.textFaint} strokeWidth={on ? 2.4 : 2} />
            <Text style={{ fontSize: 11, fontWeight: on ? '700' : '500', color: on ? colors.text : colors.textMuted }}>
              {labels[name]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(p) => <TabBar {...p} />}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Earnings" component={EarningsScreen} />
      <Tabs.Screen name="WalletTab" component={WalletScreen} />
      <Tabs.Screen name="Trips" component={TripsScreen} />
    </Tabs.Navigator>
  );
}

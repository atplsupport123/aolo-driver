import React from 'react';
import { Text } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';
import { useNetwork } from '../lib/network';
import { useT } from '../lib/i18n';
import { colors } from '../theme';

/** Shown on top of every screen when NetInfo reports no internet. */
export default function OfflineBanner() {
  const online = useNetwork((s) => s.online);
  const insets = useSafeAreaInsets();
  const t = useT();
  if (online) return null;
  return (
    <Animated.View
      entering={SlideInUp}
      exiting={SlideOutUp}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top + 6,
        paddingBottom: 8,
        paddingHorizontal: 16,
        backgroundColor: colors.red,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <WifiOff size={16} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 12, flex: 1 }}>{t('net.offline')}</Text>
    </Animated.View>
  );
}

// Pieces shared by ride request, in-trip and booking screens.
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '../theme';
import type { Place } from '../api/types';

export function BottomSheet({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <SafeAreaView edges={['bottom']} style={[styles.sheet, style]}>
      {children}
    </SafeAreaView>
  );
}

export function PickupDrop({ pickup, drop, dropLabel }: { pickup: Place; drop: Place | null; dropLabel?: string }) {
  return (
    <View style={{ gap: 8, marginVertical: spacing.sm }}>
      <View style={styles.pdRow}>
        <View style={styles.dot} />
        <Text style={styles.pdText} numberOfLines={1}>
          {pickup.name}
        </Text>
      </View>
      <View style={styles.pdRow}>
        <View style={styles.sq} />
        <Text style={styles.pdText} numberOfLines={1}>
          {drop?.name ?? dropLabel ?? 'Multiple stops'}
        </Text>
      </View>
    </View>
  );
}

/** "1.2 km · Turn right at Bangaon Road" navigation chip at the top of trip screens. */
export function NavInstruction({ distanceKm, text }: { distanceKm: number; text: string }) {
  return (
    <View style={styles.nav}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{distanceKm} km</Text>
      <Text style={{ color: '#fff', fontSize: 13, flex: 1 }}>{text}</Text>
    </View>
  );
}

export function SosButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.sos}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>SOS</Text>
    </Pressable>
  );
}

export function FareHeadline({ amount, sub }: { amount: string; sub?: string }) {
  return (
    <View style={{ marginTop: spacing.sm }}>
      <Text style={font.money}>{amount}</Text>
      {sub ? <Text style={[font.small, { marginTop: 2 }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  pdRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  sq: { width: 10, height: 10, backgroundColor: colors.primary },
  pdText: { fontSize: 14, fontWeight: '700', flex: 1 },
  nav: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sos: {
    position: 'absolute',
    right: 16,
    top: 90,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});

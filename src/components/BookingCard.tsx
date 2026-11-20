import React from 'react';
import { Text, View } from 'react-native';
import { Card } from './ui';
import { colors, font } from '../theme';
import { inr, rideTypeShort } from '../utils/format';
import type { Booking } from '../api/types';

export function fitText(b: Booking) {
  if (b.fit === 'ok')
    return b.spare_min && b.spare_min < 180 ? `You can take this. ${b.spare_min} min to spare.` : 'You can take this';
  if (b.fit === 'tight') return `Tight. Only ${b.spare_min} min to spare.`;
  return 'Cannot take. Your ride ends too late.';
}

export const fitTone = (b: Booking) =>
  b.fit === 'ok'
    ? { bg: colors.greenSoft, fg: colors.green }
    : b.fit === 'tight'
      ? { bg: colors.amberSoft, fg: colors.amber }
      : { bg: colors.redSoft, fg: colors.red };

export default function BookingCard({
  b,
  onPress,
  showPosted = true,
}: {
  b: Booking;
  onPress?: () => void;
  showPosted?: boolean;
}) {
  const tone = fitTone(b);
  return (
    <Card onPress={onPress} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={font.small}>{rideTypeShort[b.type]}</Text>
        <Text style={font.small}>
          {showPosted ? (b.is_new ? `New, ${b.posted_ago}` : b.posted_ago) : b.meta.split(' · ')[0]}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={font.h3}>{b.title}</Text>
          <Text style={font.small}>{b.meta}</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800' }}>{inr(b.fare)}</Text>
      </View>
      <View
        style={{ backgroundColor: tone.bg, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, marginTop: 10 }}
      >
        <Text style={{ color: tone.fg, fontWeight: '700', fontSize: 12 }}>{fitText(b)}</Text>
      </View>
    </Card>
  );
}

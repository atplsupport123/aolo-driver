// PDF p.20–25 — incoming ride request, one layout for all six ride types.
import React, { useEffect } from 'react';
import { Text, Vibration, View } from 'react-native';
import MapPanel from '../../components/MapPanel';
import { BottomSheet, FareHeadline, PickupDrop } from '../../components/ride';
import { Button, Pill, ProgressBar, StatGrid } from '../../components/ui';
import { ridesApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useAction } from '../../hooks/useApi';
import { useCountdown } from '../../hooks/useCountdown';
import { useRide } from '../../store/ride';
import { colors, font } from '../../theme';
import { inr, minutes, rideTypeLabel } from '../../utils/format';
import { time } from '../../lib/date';
import type { RideOffer } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

function details(o: RideOffer): { sub: string; stats: { label: string; value: string }[]; accept: string } {
  switch (o.type) {
    case 'city':
      return {
        sub: `Commission ${o.commission_pct}%: ${inr(o.commission)} · ${o.pickup_distance_km} km · ${o.pickup_eta_min} min away`,
        stats: [
          { label: 'Distance', value: `${o.distance_km} km` },
          { label: 'Trip time', value: `${o.duration_min} min` },
          { label: 'Payment', value: o.payment === 'cash' ? 'Cash' : 'Online' },
          { label: 'Your net', value: inr(o.net) },
        ],
        accept: 'Accept',
      };
    case 'outstation_oneway':
      return {
        sub: o.note ?? `${o.distance_km} km`,
        stats: [
          { label: 'Distance', value: `${o.distance_km} km` },
          { label: 'Duration', value: minutes(o.duration_min ?? 0) },
          { label: 'Return', value: 'Empty' },
          { label: 'Your net', value: inr(o.net) },
        ],
        accept: 'Accept one-way',
      };
    case 'outstation_round':
      return {
        sub: o.note ?? '',
        stats: [
          { label: 'Days', value: String(o.days) },
          { label: 'Total km', value: `${o.distance_km} km` },
          { label: 'Allowance', value: `${inr(o.allowance_per_day)} / day` },
          { label: 'Return by', value: o.return_by ?? '—' },
        ],
        accept: 'Accept round trip',
      };
    case 'rental':
      return {
        sub: o.note ?? '',
        stats: [
          { label: 'Package', value: o.package_label ?? '' },
          { label: 'Extra km', value: `${inr(o.extra_km_rate)} / km` },
          { label: 'Extra hour', value: `${inr(o.extra_hour_rate)} / hr` },
          {
            label: 'Start',
            value: o.starts_at ? time(o.starts_at) : 'Now',
          },
        ],
        accept: 'Accept rental',
      };
    case 'airport':
      return {
        sub: o.note ?? '',
        stats: [
          { label: 'Terminal', value: o.terminal ?? '—' },
          { label: 'Flight', value: o.flight ?? '—' },
          { label: 'Parking', value: inr(o.parking) },
          { label: 'Toll', value: o.toll_note ?? 'As per route' },
        ],
        accept: 'Accept airport ride',
      };
    case 'parcel':
      return {
        sub: o.note ?? '',
        stats: [
          { label: 'Item', value: o.parcel?.item ?? '' },
          { label: 'Size', value: o.parcel?.size ?? '' },
          { label: 'Pickup OTP', value: o.parcel?.pickup_otp ? 'Required' : 'No' },
          { label: 'Delivery OTP', value: o.parcel?.delivery_otp ? 'Required' : 'No' },
        ],
        accept: 'Accept parcel',
      };
  }
}

export default function RideRequestScreen({ navigation, route }: ScreenProps<'RideRequest'>) {
  const { offer } = route.params;
  const setActive = useRide((s) => s.setActive);
  const setOffer = useRide((s) => s.setOffer);
  // Mark this offer as on screen, so a duplicate push/poll event does not open it twice.
  useEffect(() => {
    setOffer(offer);
    return () => setOffer(null);
  }, [offer, setOffer]);
  const d = details(offer);

  const decline = () => {
    ridesApi.decline(offer.id).catch(() => {});
    navigation.goBack();
  };
  const left = useCountdown(offer.expires_in_sec, decline);

  useEffect(() => {
    Vibration.vibrate([0, 400, 200, 400]);
  }, []);

  const accept = useAction(ridesApi.accept);
  const onAccept = async () => {
    try {
      const ride = await accept.run(offer);
      setActive(ride);
      navigation.replace('PickupOtp');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) navigation.goBack();
    }
  };

  const typeParts = rideTypeLabel[offer.type].split(' ');
  return (
    <View style={{ flex: 1, backgroundColor: colors.map }}>
      <MapPanel pickup={offer.pickup} drop={offer.drop} />
      <BottomSheet>
        <ProgressBar value={left / offer.expires_in_sec} color={colors.primary} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Pill text={typeParts[0] === 'City' ? 'City ride' : typeParts[0]} tone="dark" />
            {typeParts[0] === 'Outstation' && <Pill text={typeParts.slice(1).join(' ')} tone="dark" />}
          </View>
          <Text style={font.small}>{offer.payment === 'cash' ? 'Pays cash' : 'Paid online'}</Text>
        </View>
        <FareHeadline amount={inr(offer.fare)} sub={d.sub} />
        <PickupDrop pickup={offer.pickup} drop={offer.drop} />
        <StatGrid items={d.stats} />
        <View style={{ marginTop: 14, gap: 4 }}>
          <Button title={`${d.accept} ${left}s`} onPress={onAccept} loading={accept.loading} />
          <Button title="Decline" variant="ghost" onPress={decline} />
        </View>
      </BottomSheet>
    </View>
  );
}

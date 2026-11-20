// PDF p.32 — Rental mode (8 hr / 80 km)
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import MapPanel from '../../components/MapPanel';
import { BottomSheet } from '../../components/ride';
import { Button, Input, Pill, ProgressBar, Stat } from '../../components/ui';
import { ridesApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { useRide } from '../../store/ride';
import { colors, font } from '../../theme';
import { minutes } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function RentalModeScreen({ navigation }: ScreenProps<'RentalMode'>) {
  const ride = useRide((s) => s.active);
  const [stop, setStop] = useState('');
  const [adding, setAdding] = useState(false);
  const addStop = useAction(ridesApi.addStop);
  if (!ride) return null;

  const pkgMin = (ride.package_hours ?? 8) * 60;
  const pkgKm = ride.package_km ?? 80;
  const used = ride.time_used_min ?? 0;
  const km = ride.km_used ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <MapPanel pickup={ride.pickup} />
      <BottomSheet>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={font.h2}>Rental mode</Text>
          <Pill text={ride.package_label ?? '8 hr / 80 km'} tone="dark" />
        </View>
        <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginVertical: 12 }}>
          <Text style={font.tiny}>Rider</Text>
          <Text style={{ fontWeight: '700' }}>
            {ride.rider.name} · Rating {ride.rider.rating}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={font.small}>Time used</Text>
          <Text style={{ fontWeight: '700' }}>
            {minutes(used)} of {ride.package_hours ?? 8}h
          </Text>
        </View>
        <View style={{ marginVertical: 6 }}>
          <ProgressBar value={used / pkgMin} color={colors.primary} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={font.small}>Distance</Text>
          <Text style={{ fontWeight: '700' }}>
            {km} km of {pkgKm} km
          </Text>
        </View>
        <View style={{ marginVertical: 6 }}>
          <ProgressBar value={km / pkgKm} color={colors.primary} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
          <Stat label="Extra km" value={Math.max(0, km - pkgKm)} />
          <Stat label="Extra time" value={Math.max(0, used - pkgMin) ? minutes(used - pkgMin) : 0} />
        </View>
        {adding ? (
          <View>
            <Input placeholder="Stop name or address" value={stop} onChangeText={setStop} autoFocus />
            <Button
              title="Add stop"
              variant="outline"
              loading={addStop.loading}
              onPress={async () => {
                if (!stop.trim()) return;
                try {
                  await addStop.run(ride.id, stop.trim());
                  setStop('');
                  setAdding(false);
                  Alert.alert('Stop added');
                } catch {
                  /* shown */
                }
              }}
            />
          </View>
        ) : (
          <Button title="Add a stop" variant="outline" onPress={() => setAdding(true)} />
        )}
        <Button
          title="End rental"
          onPress={() => navigation.navigate('EndTripExtras')}
          style={{ marginTop: 8, marginBottom: 8 }}
        />
      </BottomSheet>
    </View>
  );
}

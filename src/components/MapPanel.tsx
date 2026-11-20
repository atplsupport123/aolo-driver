import React, { ReactNode, useMemo } from 'react';
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { colors } from '../theme';
import type { LatLng, Place } from '../api/types';

const SAHARSA = { lat: 25.8777, lng: 86.5966 };

/**
 * Map used across the app. Pass pickup/drop to show "A Pickup → B Drop".
 * `route` takes an encoded-and-decoded polyline from the backend
 * (Google Directions via Laravel); if absent we draw a straight line.
 */
export default function MapPanel({
  pickup,
  drop,
  me,
  route,
  pulse,
  style,
  children,
}: {
  pickup?: Place | null;
  drop?: Place | null;
  me?: LatLng | null;
  route?: LatLng[];
  pulse?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const a = pickup?.lat ? { latitude: pickup.lat, longitude: pickup.lng! } : null;
  const b = drop?.lat ? { latitude: drop.lat, longitude: drop.lng! } : null;
  const center = me ?? (pickup?.lat ? { lat: pickup.lat, lng: pickup.lng! } : SAHARSA);

  const region = useMemo(() => {
    if (a && b) {
      const lat = (a.latitude + b.latitude) / 2;
      const lng = (a.longitude + b.longitude) / 2;
      const dLat = Math.abs(a.latitude - b.latitude) * 1.8 + 0.01;
      const dLng = Math.abs(a.longitude - b.longitude) * 1.8 + 0.01;
      return { latitude: lat, longitude: lng, latitudeDelta: dLat, longitudeDelta: dLng };
    }
    return { latitude: center.lat, longitude: center.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 };
  }, [a?.latitude, b?.latitude, center.lat, center.lng]);

  const line = route?.map((p) => ({ latitude: p.lat, longitude: p.lng })) ?? (a && b ? [a, b] : null);

  return (
    <View style={[{ flex: 1, backgroundColor: colors.map }, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        // Google Maps on Android; Apple Maps on iOS (works in Expo Go without a key)
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation={!a}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        customMapStyle={greyStyle}
      >
        {pulse && (
          <Circle
            center={{ latitude: center.lat, longitude: center.lng }}
            radius={600}
            fillColor="rgba(12,120,60,0.15)"
            strokeColor="rgba(12,120,60,0.25)"
          />
        )}
        {line && <Polyline coordinates={line} strokeColor={colors.primary} strokeWidth={4} />}
        {a && (
          <Marker coordinate={a} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.dotGreen} />
          </Marker>
        )}
        {b && (
          <Marker coordinate={b} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.square} />
          </Marker>
        )}
      </MapView>
      {pickup && (
        <View style={[styles.tag, { bottom: 32, left: 24 }]}>
          <Text style={styles.tagText}>A Pickup</Text>
        </View>
      )}
      {drop !== undefined && pickup && (
        <View style={[styles.tag, { top: 24, right: 60 }]}>
          <Text style={styles.tagText}>B Drop</Text>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dotGreen: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    borderWidth: 3,
    borderColor: '#fff',
  },
  square: { width: 14, height: 14, backgroundColor: colors.primary, borderWidth: 2, borderColor: '#fff' },
  tag: {
    position: 'absolute',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tagText: { fontSize: 11, fontWeight: '700' },
});

// Muted, low-noise map so ride cards stand out (matches the grey PDF maps).
const greyStyle = [
  { elementType: 'geometry', stylers: [{ color: '#eeeeec' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#707070' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d6dde0' }] },
];

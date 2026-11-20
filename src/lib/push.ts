// Push notifications (expo-notifications).
// Laravel sends a push with data: { event: "ride.offered", payload: {...}, id: "evt_123" }.
// Remote push needs a development/release build (not Expo Go); everything here is guarded.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { http } from '../api/client';
import { config } from '../api/config';
import { prefs } from './storage';
import { handleDriverEvent } from './events';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function route(n: Notifications.Notification) {
  const data = n.request.content.data as { event?: string; payload?: any; id?: string } | undefined;
  if (data?.event) handleDriverEvent(data.event as any, data.payload ?? {}, data.id);
}

/** Asks permission, registers the device token with Laravel, and listens. Returns a cleanup fn. */
export async function setupPush(): Promise<() => void> {
  const subs: { remove: () => void }[] = [];
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rides', {
        name: 'Ride requests',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 400, 200, 400],
      });
    }
    subs.push(Notifications.addNotificationReceivedListener(route));
    subs.push(Notifications.addNotificationResponseReceivedListener((r) => route(r.notification)));

    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted || config.useMock) return () => subs.forEach((s) => s.remove());

    // Native FCM / APNs token: Laravel can send directly (e.g. laravel-notification-channels/fcm).
    const token = await Notifications.getDevicePushTokenAsync();
    const value = typeof token.data === 'string' ? token.data : JSON.stringify(token.data);
    if (value !== prefs.pushToken()) {
      await http.post('/driver/push-tokens', { token: value, provider: token.type, platform: Platform.OS });
      prefs.setPushToken(value);
    }
  } catch {
    // Expo Go or no Firebase config yet — polling still delivers events while the app is open.
  }
  return () => subs.forEach((s) => s.remove());
}

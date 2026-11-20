// PDF p.34 — Booking popups settings
import React from 'react';
import { Screen, Header, ToggleRow, Banner } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { driverApi } from '../../api/endpoints';
import type { PopupSettings } from '../../api/types';

export default function BookingPopupSettingsScreen() {
  const { driver, setDriver } = useAuth();
  const s = driver?.popup_settings ?? { show_popups: true, show_during_ride: true, sound: true };

  const update = (patch: Partial<PopupSettings>) => {
    const next = { ...s, ...patch };
    setDriver({ popup_settings: next }); // optimistic
    driverApi.setPopupSettings(next).catch(() => setDriver({ popup_settings: s }));
  };

  return (
    <Screen>
      <Header
        title="Booking popups"
        subtitle="New outstation, rental and airport bookings can pop up on your screen."
      />
      <ToggleRow
        title="Show booking popups"
        subtitle="Turn off to see bookings only in the Bookings list"
        value={s.show_popups}
        onChange={(v) => update({ show_popups: v })}
      />
      <ToggleRow
        title="Show popups during a ride"
        subtitle="Only bookings that fit your schedule"
        value={s.show_during_ride && s.show_popups}
        onChange={(v) => update({ show_during_ride: v })}
      />
      <ToggleRow
        title="Sound for new bookings"
        subtitle="A short beep when a popup comes"
        value={s.sound}
        onChange={(v) => update({ sound: v })}
      />
      <Banner
        tone="gray"
        style={{ marginTop: 16 }}
        text="A popup stays for 45 seconds. If you do not accept, it moves to your Bookings list. The first driver to press Accept gets the booking."
      />
    </Screen>
  );
}

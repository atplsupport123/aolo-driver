import { create } from 'zustand';
import { useLang } from '../lib/i18n';
import { stopBackgroundLocation } from '../tasks/backgroundLocation';
import { loadToken, setToken, setUnauthorizedHandler } from '../api/client';
import { authApi, driverApi } from '../api/endpoints';
import type { Driver } from '../api/types';

interface AuthState {
  ready: boolean;
  token: string | null;
  driver: Driver | null;
  /** Mobile number in progress during the OTP flow. */
  pendingMobile: string | null;
  pendingIntent: 'register' | 'login';
  hydrate: () => Promise<void>;
  startOtp: (mobile: string, intent: 'register' | 'login') => Promise<number>;
  verifyOtp: (otp: string) => Promise<void>;
  refreshDriver: () => Promise<Driver | null>;
  setDriver: (d: Partial<Driver>) => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  ready: false,
  token: null,
  driver: null,
  pendingMobile: null,
  pendingIntent: 'register',

  hydrate: async () => {
    setUnauthorizedHandler(() => {
      setToken(null);
      set({ token: null, driver: null });
    });
    try {
      const token = await loadToken();
      if (!token) return set({ ready: true });
      set({ token });
      const driver = await driverApi.me();
      useLang.getState().setLang(driver.language);
      set({ driver, ready: true });
    } catch {
      // SecureStore can reject on some devices after restore or OS credential
      // changes. Always finish startup so the app can show the sign-in screen.
      set({ ready: true });
    }
  },

  startOtp: async (mobile, intent) => {
    const { resend_in } = await authApi.sendOtp(mobile, intent);
    set({ pendingMobile: mobile, pendingIntent: intent });
    return resend_in;
  },

  verifyOtp: async (otp) => {
    const mobile = get().pendingMobile;
    if (!mobile) throw new Error('Start again and enter your mobile number');
    const { token, driver } = await authApi.verifyOtp(mobile, otp);
    await setToken(token);
    useLang.getState().setLang(driver.language);
    set({ token, driver, pendingMobile: null });
  },

  refreshDriver: async () => {
    try {
      const driver = await driverApi.me();
      set({ driver });
      return driver;
    } catch {
      return null;
    }
  },

  setDriver: (d) => {
    const cur = get().driver;
    if (cur) set({ driver: { ...cur, ...d } });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    await setToken(null);
    set({ token: null, driver: null });
  },
}));

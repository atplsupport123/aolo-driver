// Values come from .env (EXPO_PUBLIC_* is built into the app by Expo; no extra package needed).
export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000/api/v1',
  // Sample-data mode. Set EXPO_PUBLIC_USE_MOCK=false once Ravi's Laravel API is reachable.
  useMock: (process.env.EXPO_PUBLIC_USE_MOCK ?? 'true') !== 'false',
  /** How often to ask the backend for new ride offers while online and in the foreground. */
  offerPollMs: 5000,
};

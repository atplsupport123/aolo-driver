// Fast key-value storage for preferences (react-native-mmkv).
// MMKV is a native module that Expo Go does not include, so in Expo Go we
// fall back to memory. In a development / release build MMKV is used.
type KV = {
  getString(k: string): string | undefined;
  set(k: string, v: string | number | boolean): void;
  getBoolean(k: string): boolean | undefined;
  delete(k: string): void;
};

function createStore(): KV {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-mmkv');
    const inst = mod.createMMKV ? mod.createMMKV({ id: 'aolo' }) : new mod.MMKV({ id: 'aolo' });
    return {
      getString: (k) => inst.getString(k),
      getBoolean: (k) => inst.getBoolean(k),
      set: (k, v) => inst.set(k, v),
      delete: (k) => (inst.remove ? inst.remove(k) : inst.delete(k)),
    };
  } catch {
    const mem = new Map<string, string | number | boolean>();
    return {
      getString: (k) => (mem.has(k) ? String(mem.get(k)) : undefined),
      getBoolean: (k) => (mem.has(k) ? Boolean(mem.get(k)) : undefined),
      set: (k, v) => void mem.set(k, v),
      delete: (k) => void mem.delete(k),
    };
  }
}

export const storage = createStore();

export const prefs = {
  language: () => (storage.getString('language') as 'en' | 'hi' | undefined) ?? 'en',
  setLanguage: (l: 'en' | 'hi') => storage.set('language', l),
  pushToken: () => storage.getString('push_token'),
  setPushToken: (t: string) => storage.set('push_token', t),
};

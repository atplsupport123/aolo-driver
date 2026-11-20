import React, { ReactNode, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuth } from './src/store/auth';
import { startNetworkWatcher, flushOffline } from './src/lib/network';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// react-native-keyboard-controller is a native module that Expo Go may not
// include. Use it when available; otherwise render children as they are.
let KeyboardProvider: (p: { children: ReactNode }) => ReactNode = ({ children }) => children;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  KeyboardProvider = require('react-native-keyboard-controller').KeyboardProvider;
} catch {
  /* Expo Go */
}

export default function App() {
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => {
    startNetworkWatcher();
    hydrate().then(flushOffline);
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar barStyle="dark-content" />
            <RootNavigator />
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

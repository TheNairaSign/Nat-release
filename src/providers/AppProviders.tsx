import type { ReactNode } from 'react';
import { QueryClientProvider } from '@/shared/adapters/react-query';

import { createHttpClient } from '@/shared/adapters/http.expo-fetch';
import { createAsyncStorageStore } from '@/shared/adapters/key-value-store.async-storage';
import { createGuestIdSource } from '@/shared/adapters/guest-id';
import { createExpoCamera } from '@/shared/adapters/camera.expo';
import { createExpoLocation } from '@/shared/adapters/location.expo';
import { createRnShare } from '@/shared/adapters/share.rn';
import { createExpoSpeech } from '@/shared/adapters/speech.expo';
import { createExpoLinking } from '@/shared/adapters/linking.expo';
import { createExpoRouterNavigation } from '@/shared/adapters/navigation.expo-router';
import { createExpoNotifications } from '@/shared/adapters/notifications.expo';
import {
  createNoopAnalytics,
  createNoopBiometrics,
  createNoopClipboard,
  createNoopCrashReporting,
  createNoopHaptics,
  createSystemClock,
  createUuid,
} from '@/shared/adapters/noop';
import { createSecureStore } from '@/shared/adapters/secure-store.expo';
import { createQueryClient } from '@/shared/api/query-client';
import { SESSION_TOKEN_KEY } from '@/shared/config/constants';
import { getEnv } from '@/shared/config/env';
import { createFeatureFlags } from '@/shared/config/feature-flags';
import { PortsProvider } from '@/shared/hooks/use-ports';
import '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

const queryClient = createQueryClient();
const env = getEnv();
const secureStore = createSecureStore();
const kv = createAsyncStorageStore();
const getGuestId = createGuestIdSource(kv);

const ports = {
  kv,
  secureStore,
  http: createHttpClient(`${env.apiUrl}/api`, {
    getToken: () => secureStore.get(SESSION_TOKEN_KEY),
    getGuestId,
  }),
  navigation: createExpoRouterNavigation(),
  analytics: createNoopAnalytics(),
  crash: createNoopCrashReporting(),
  flags: createFeatureFlags(),
  clock: createSystemClock(),
  uuid: createUuid(),
  notifications: createExpoNotifications(),
  camera: createExpoCamera(),
  location: createExpoLocation(),
  haptics: createNoopHaptics(),
  clipboard: createNoopClipboard(),
  share: createRnShare(),
  linking: createExpoLinking(),
  biometrics: createNoopBiometrics(),
  guestId: getGuestId,
  speech: createExpoSpeech(),
};

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PortsProvider ports={ports}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </PortsProvider>
    </ThemeProvider>
  );
}

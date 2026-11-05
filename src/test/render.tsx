import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/features/auth';
import { createMemoryStore } from '@/shared/adapters/key-value-store.memory';
import { createMemorySecureStore } from '@/shared/adapters/secure-store.memory';
import {
  createNoopAnalytics,
  createNoopBiometrics,
  createNoopCamera,
  createNoopClipboard,
  createNoopCrashReporting,
  createNoopHaptics,
  createNoopLinking,
  createNoopLocation,
  createNoopNotifications,
  createNoopShare,
  createSystemClock,
  createUuid,
} from '@/shared/adapters/noop';
import { createFeatureFlags } from '@/shared/config/feature-flags';
import { PortsProvider, type AppPorts } from '@/shared/hooks/use-ports';
import '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

export function createTestPorts(overrides: Partial<AppPorts> = {}): AppPorts {
  return {
    kv: createMemoryStore(),
    secureStore: createMemorySecureStore(),
    http: {
      request: async () => ({ status: 200, body: { ok: true } }),
    },
    navigation: { navigate() {}, replace() {}, back() {} },
    analytics: createNoopAnalytics(),
    crash: createNoopCrashReporting(),
    flags: createFeatureFlags(),
    clock: createSystemClock(),
    uuid: createUuid(),
    notifications: createNoopNotifications(),
    camera: createNoopCamera(),
    location: createNoopLocation(),
    haptics: createNoopHaptics(),
    clipboard: createNoopClipboard(),
    share: createNoopShare(),
    linking: createNoopLinking(),
    biometrics: createNoopBiometrics(),
    guestId: async () => '0f8e4a2c-1d3b-4f5a-9e7d-2b6c8a1f0e3d',
    ...overrides,
  };
}

export async function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { ports?: Partial<AppPorts> },
) {
  const { ports: portOverrides, ...renderOptions } = options ?? {};
  const ports = createTestPorts(portOverrides);
  useSessionStore.setState({ session: null, hydrated: false });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <ThemeProvider>
          <PortsProvider ports={ports}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </PortsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

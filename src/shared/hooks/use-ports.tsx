import { createContext, useContext, type ReactNode } from 'react';

import type { Analytics } from '@/shared/ports/analytics';
import type { Biometrics } from '@/shared/ports/biometrics';
import type { Camera } from '@/shared/ports/camera';
import type { Clipboard } from '@/shared/ports/clipboard';
import type { Clock } from '@/shared/ports/clock';
import type { CrashReporting } from '@/shared/ports/crash-reporting';
import type { FeatureFlags } from '@/shared/ports/feature-flags';
import type { Haptics } from '@/shared/ports/haptics';
import type { HttpClient } from '@/shared/ports/http';
import type { KeyValueStore } from '@/shared/ports/key-value-store';
import type { Linking } from '@/shared/ports/linking';
import type { Location } from '@/shared/ports/location';
import type { NavigationPort } from '@/shared/ports/navigation';
import type { Notifications } from '@/shared/ports/notifications';
import type { SecureStore } from '@/shared/ports/secure-store';
import type { ShareSheet } from '@/shared/ports/share';
import type { Uuid } from '@/shared/ports/uuid';

export type AppPorts = {
  kv: KeyValueStore;
  secureStore: SecureStore;
  http: HttpClient;
  navigation: NavigationPort;
  analytics: Analytics;
  crash: CrashReporting;
  flags: FeatureFlags;
  clock: Clock;
  uuid: Uuid;
  notifications: Notifications;
  camera: Camera;
  location: Location;
  haptics: Haptics;
  clipboard: Clipboard;
  share: ShareSheet;
  linking: Linking;
  biometrics: Biometrics;
};

const PortsContext = createContext<AppPorts | null>(null);

export function PortsProvider({
  ports,
  children,
}: {
  ports: AppPorts;
  children: ReactNode;
}) {
  return (
    <PortsContext.Provider value={ports}>{children}</PortsContext.Provider>
  );
}

export function usePorts(): AppPorts {
  const ports = useContext(PortsContext);
  if (!ports) {
    throw new Error('usePorts must be used within PortsProvider');
  }
  return ports;
}

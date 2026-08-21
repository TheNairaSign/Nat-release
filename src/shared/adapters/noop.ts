import type { Analytics } from '@/shared/ports/analytics';
import type { Biometrics } from '@/shared/ports/biometrics';
import type { Camera } from '@/shared/ports/camera';
import type { Clipboard } from '@/shared/ports/clipboard';
import type { Clock } from '@/shared/ports/clock';
import type { CrashReporting } from '@/shared/ports/crash-reporting';
import type { FeatureFlags } from '@/shared/ports/feature-flags';
import type { Haptics } from '@/shared/ports/haptics';
import type { Linking } from '@/shared/ports/linking';
import type { Location } from '@/shared/ports/location';
import type { Notifications } from '@/shared/ports/notifications';
import type { ShareSheet } from '@/shared/ports/share';
import type { Uuid } from '@/shared/ports/uuid';

export function createNoopAnalytics(): Analytics {
  return { track() {}, identify() {} };
}

export function createNoopCrashReporting(): CrashReporting {
  return { captureException() {} };
}

export function createStaticFeatureFlags(
  flags: Record<string, boolean> = {},
): FeatureFlags {
  return { isEnabled: (flag) => flags[flag] === true };
}

export function createSystemClock(): Clock {
  return { now: () => new Date() };
}

export function createUuid(): Uuid {
  return {
    v4: () => globalThis.crypto.randomUUID(),
  };
}

export function createNoopNotifications(): Notifications {
  return {
    requestPermission: async () => false,
    getPermissionStatus: async () => 'undetermined',
    getDevicePushToken: async () => null,
    setBadgeCount: async () => {},
  };
}

export function createNoopCamera(): Camera {
  return {
    requestPermission: async () => false,
    takePhoto: async () => null,
    pickImage: async () => null,
  };
}

export function createNoopLocation(): Location {
  return {
    requestPermission: async () => false,
    getCurrentPosition: async () => null,
  };
}

export function createNoopHaptics(): Haptics {
  return { light() {} };
}

export function createNoopClipboard(): Clipboard {
  return { copy: async () => {} };
}

export function createNoopShare(): ShareSheet {
  return { share: async () => {} };
}

export function createNoopLinking(): Linking {
  return { openUrl: async () => {} };
}

export function createNoopBiometrics(): Biometrics {
  return { isAvailable: async () => false };
}

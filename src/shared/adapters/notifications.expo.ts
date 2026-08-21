import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as ExpoNotifications from 'expo-notifications';

import type {
  DevicePushToken,
  NotificationPermissionStatus,
  Notifications,
} from '@/shared/ports/notifications';

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function mapStatus(status: string): NotificationPermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export function createExpoNotifications(): Notifications {
  return {
    async requestPermission() {
      if (!Device.isDevice && Platform.OS !== 'web') {
        return false;
      }
      if (Platform.OS === 'android') {
        await ExpoNotifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: ExpoNotifications.AndroidImportance.DEFAULT,
        });
      }
      const current = await ExpoNotifications.getPermissionsAsync();
      let status = current.status;
      if (status !== 'granted') {
        const requested = await ExpoNotifications.requestPermissionsAsync();
        status = requested.status;
      }
      return status === 'granted';
    },
    async getPermissionStatus() {
      const current = await ExpoNotifications.getPermissionsAsync();
      return mapStatus(current.status);
    },
    async getDevicePushToken() {
      try {
        const device = await ExpoNotifications.getDevicePushTokenAsync();
        const token =
          typeof device.data === 'string'
            ? device.data
            : String(device.data ?? '');
        if (!token || token.length < 20) return null;
        const platform: DevicePushToken['platform'] =
          Platform.OS === 'ios'
            ? 'ios'
            : Platform.OS === 'android'
              ? 'android'
              : 'web';
        return {
          token,
          platform,
          deviceId: Device.osInternalBuildId ?? Device.modelId ?? undefined,
        };
      } catch {
        return null;
      }
    },
    async setBadgeCount(count) {
      try {
        await ExpoNotifications.setBadgeCountAsync(Math.max(0, count));
      } catch {
        /* web / unsupported */
      }
    },
  };
}

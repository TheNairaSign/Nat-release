export type PushPlatform = 'ios' | 'android' | 'web';

export type DevicePushToken = {
  token: string;
  platform: PushPlatform;
  deviceId?: string;
};

export type NotificationPermissionStatus =
  'granted' | 'denied' | 'undetermined';

export interface Notifications {
  requestPermission(): Promise<boolean>;
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  getDevicePushToken(): Promise<DevicePushToken | null>;
  setBadgeCount(count: number): Promise<void>;
}

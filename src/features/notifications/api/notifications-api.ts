import { unwrapList } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';
import type { AppNotification } from '@/core/notifications';
import type { DevicePushToken } from '@/shared/ports/notifications';

export const notificationsQueryKey = ['notifications'] as const;

export async function fetchNotifications(
  http: HttpClient,
): Promise<AppNotification[]> {
  const response = await http.request({
    path: '/notifications',
    method: 'GET',
  });
  if (response.status >= 300) return [];
  const docs = unwrapList(response.body);
  // Prefer paginated docs shape from web: data.docs
  const nested =
    response.body &&
    typeof response.body === 'object' &&
    (response.body as { data?: { docs?: unknown } }).data?.docs;
  const rows = Array.isArray(nested) ? nested : docs;
  const out: AppNotification[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    const id =
      typeof item._id === 'string'
        ? item._id
        : typeof item.id === 'string'
          ? item.id
          : '';
    if (!id) continue;
    out.push({
      id,
      title: typeof item.title === 'string' ? item.title : 'Notification',
      message: typeof item.message === 'string' ? item.message : '',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
      read: item.read === true,
    });
  }
  return out;
}

export async function registerDevicePushToken(
  http: HttpClient,
  push: DevicePushToken,
): Promise<boolean> {
  const response = await http.request({
    path: '/user/fcm-token',
    method: 'POST',
    body: {
      token: push.token,
      platform: push.platform,
      ...(push.deviceId ? { deviceId: push.deviceId } : {}),
    },
  });
  return response.status >= 200 && response.status < 300;
}

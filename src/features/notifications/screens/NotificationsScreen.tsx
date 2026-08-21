import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { formatNotificationDate } from '@/core/notifications';
import {
  fetchNotifications,
  notificationsQueryKey,
} from '../api/notifications-api';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';

export function NotificationsScreen() {
  const theme = useTheme();
  const { http, navigation, notifications } = usePorts();
  const [pushHint, setPushHint] = useState('');
  const query = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => fetchNotifications(http),
  });
  const items = query.data ?? [];
  const unread = items.filter((item) => item.read === false).length;

  useEffect(() => {
    void notifications.setBadgeCount(unread);
  }, [unread, notifications]);

  async function enablePush() {
    setPushHint('');
    const granted = await notifications.requestPermission();
    if (!granted) {
      setPushHint('Notification permission was not granted.');
      return;
    }
    setPushHint('Push notifications enabled on this device.');
  }

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.back()} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <Text style={{ fontSize: 20, fontFamily: theme.font.semibold }}>
          Notifications
        </Text>
        <Pressable
          testID="notifications-enable-push"
          onPress={() => void enablePush()}
        >
          <Text
            variant="small"
            style={{
              fontFamily: theme.font.semibold,
              color: theme.color.forest,
            }}
          >
            Enable push
          </Text>
        </Pressable>
      </View>
      {pushHint ? (
        <Text variant="small" muted style={{ marginTop: 8 }}>
          {pushHint}
        </Text>
      ) : null}
      {query.isPending ? (
        <Text muted style={{ marginTop: 24, textAlign: 'center' }}>
          Loading…
        </Text>
      ) : items.length === 0 ? (
        <Text style={{ marginTop: 24 }}>No notifications</Text>
      ) : (
        items.map((item) => (
          <View
            key={item.id}
            testID={`notification-${item.id}`}
            style={{
              marginTop: 8,
              padding: 16,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.color.borderSolid,
              backgroundColor: theme.color.surface,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontFamily: theme.font.semibold, marginBottom: 4 }}
              >
                {item.title}
              </Text>
              <Text variant="small">{item.message}</Text>
              <Text variant="caption" muted style={{ marginTop: 4 }}>
                {formatNotificationDate(item.createdAt)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ChromeScreen>
  );
}

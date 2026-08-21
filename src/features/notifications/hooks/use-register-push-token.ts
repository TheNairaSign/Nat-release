import { useEffect, useRef } from 'react';

import { registerDevicePushToken } from '../api/notifications-api';
import { usePorts } from '@/shared/hooks/use-ports';

/** Registers the device FCM/APNs token with the API once per signed-in session. */
export function useRegisterPushToken(enabled: boolean) {
  const { http, notifications } = usePorts();
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    let cancelled = false;
    void (async () => {
      const granted = await notifications.requestPermission();
      if (!granted || cancelled) return;
      const token = await notifications.getDevicePushToken();
      if (!token || cancelled) return;
      const ok = await registerDevicePushToken(http, token);
      if (ok && !cancelled) ran.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, http, notifications]);
}

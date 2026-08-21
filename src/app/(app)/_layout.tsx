import { Redirect, Stack, usePathname } from 'expo-router';
import { useState } from 'react';

import { isAuthenticated } from '@/core/session';
import {
  GuestSignInModal,
  useHydrateSession,
  useSession,
} from '@/features/auth';
import { useRegisterPushToken } from '@/features/notifications';
import { ShellScaffold } from '@/features/shell';
import { Screen, Text } from '@/shared/ui';

export default function AppGate() {
  useHydrateSession();
  const { session, hydrated } = useSession();
  const pathname = usePathname();
  const [guestModal, setGuestModal] = useState(false);
  useRegisterPushToken(Boolean(hydrated && isAuthenticated(session)));

  if (!hydrated) {
    return (
      <Screen>
        <Text muted>Loading…</Text>
      </Screen>
    );
  }

  if (!isAuthenticated(session)) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <ShellScaffold
      guest={false}
      pathname={pathname}
      onLockedTab={() => setGuestModal(true)}
    >
      <Stack screenOptions={{ headerShown: false }} />
      <GuestSignInModal
        open={guestModal}
        onClose={() => setGuestModal(false)}
        message="Sign in to view your impact and profile, and start earning Carbon Units."
      />
    </ShellScaffold>
  );
}

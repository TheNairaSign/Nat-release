import { Stack, usePathname } from 'expo-router';
import { useState } from 'react';

import { GuestSignInModal } from '@/features/auth';
import { ShellScaffold } from '@/features/shell';

export default function GuestLayout() {
  const pathname = usePathname();
  const [guestModal, setGuestModal] = useState(false);

  return (
    <ShellScaffold
      guest
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

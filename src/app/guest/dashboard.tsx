import { useState } from 'react';

import { GuestSignInModal } from '@/features/auth';
import { HomeScreen } from '@/features/home';

export default function GuestDashboard() {
  const [aiLock, setAiLock] = useState(false);

  return (
    <>
      <HomeScreen guest onRequireSignIn={() => setAiLock(true)} />
      <GuestSignInModal
        open={aiLock}
        onClose={() => setAiLock(false)}
        message="Sign in to explore AI suggestions and ask custom questions about recycling."
      />
    </>
  );
}

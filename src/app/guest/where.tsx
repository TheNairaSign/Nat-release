import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { GuestSignInModal } from '@/features/auth';
import { WhereScreen, type WhereSignInIntent } from '@/features/where';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function GuestWhere() {
  const params = useLocalSearchParams<{
    type?: string | string[];
    organization?: string | string[];
    locationId?: string | string[];
    materialType?: string | string[];
    focus?: string | string[];
    eventId?: string | string[];
  }>();
  const [lock, setLock] = useState<WhereSignInIntent | null>(null);

  return (
    <>
      <WhereScreen
        guest
        type={first(params.type) ?? first(params.materialType)}
        organization={first(params.organization)}
        locationId={first(params.locationId)}
        initialFocus={first(params.focus)}
        eventId={first(params.eventId)}
        onRequireSignIn={(intent) => setLock(intent ?? 'record')}
      />
      <GuestSignInModal
        open={Boolean(lock)}
        onClose={() => setLock(null)}
        message={
          lock === 'reminder'
            ? 'Sign in to get event reminders.'
            : 'Sign in to record your drop-off and earn Carbon Units.'
        }
      />
    </>
  );
}

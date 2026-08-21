import { useEffect } from 'react';

import type { Session } from '@/core/session';
import { SESSION_TOKEN_KEY, SESSION_USER_KEY } from '@/shared/config/constants';
import { usePorts } from '@/shared/hooks/use-ports';
import { create } from '@/shared/state';

type SessionState = {
  session: Session | null;
  hydrated: boolean;
  setSession: (session: Session | null) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  hydrated: false,
  setSession: (session) => set({ session }),
  setHydrated: (hydrated) => set({ hydrated }),
}));

export function useHydrateSession(): void {
  const { secureStore } = usePorts();
  const setSession = useSessionStore((s) => s.setSession);
  const setHydrated = useSessionStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await secureStore.get(SESSION_TOKEN_KEY);
      const userId = await secureStore.get(SESSION_USER_KEY);
      if (!cancelled) {
        setSession(token && userId ? { token, userId } : null);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [secureStore, setHydrated, setSession]);
}

export function useSession() {
  const { secureStore } = usePorts();
  const session = useSessionStore((s) => s.session);
  const hydrated = useSessionStore((s) => s.hydrated);
  const setSession = useSessionStore((s) => s.setSession);

  async function persist(next: Session | null) {
    if (next) {
      await secureStore.set(SESSION_TOKEN_KEY, next.token);
      await secureStore.set(SESSION_USER_KEY, next.userId);
    } else {
      await secureStore.remove(SESSION_TOKEN_KEY);
      await secureStore.remove(SESSION_USER_KEY);
    }
    setSession(next);
  }

  return { session, hydrated, persist };
}

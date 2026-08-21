export const GUEST_TOKEN = 'guest';
export const GUEST_USER_ID = 'guest';

export type Session = {
  token: string;
  userId: string;
};

export function createGuestSession(): Session {
  return { token: GUEST_TOKEN, userId: GUEST_USER_ID };
}

export function isGuestSession(session: Session | null): boolean {
  return session?.token === GUEST_TOKEN;
}

export function isAuthenticated(session: Session | null): session is Session {
  return Boolean(session?.token) && !isGuestSession(session);
}

export function hasAppAccess(session: Session | null): session is Session {
  return Boolean(session?.token);
}

export function assertSession(session: Session | null): Session {
  if (!isAuthenticated(session)) {
    throw new Error('Not authenticated');
  }
  return session;
}

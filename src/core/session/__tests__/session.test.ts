import {
  assertSession,
  createGuestSession,
  GUEST_TOKEN,
  hasAppAccess,
  isAuthenticated,
  isGuestSession,
  type Session,
} from '../session';

describe('session', () => {
  const session: Session = { token: 't', userId: 'u1' };

  it('treats a token-bearing session as authenticated', () => {
    expect(isAuthenticated(session)).toBe(true);
    expect(isAuthenticated(null)).toBe(false);
    expect(hasAppAccess(session)).toBe(true);
  });

  it('lets a guest into the app without treating them as signed in', () => {
    const guest = createGuestSession();
    expect(guest.token).toBe(GUEST_TOKEN);
    expect(isGuestSession(guest)).toBe(true);
    expect(isAuthenticated(guest)).toBe(false);
    expect(hasAppAccess(guest)).toBe(true);
  });

  it('returns the session from assertSession', () => {
    expect(assertSession(session)).toEqual(session);
  });

  it('throws when unauthenticated', () => {
    expect(() => assertSession(null)).toThrow('Not authenticated');
    expect(() => assertSession(createGuestSession())).toThrow(
      'Not authenticated',
    );
  });
});

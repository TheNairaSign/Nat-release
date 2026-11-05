/**
 * A guest's device id, so the server counts their free AI tries per device rather than
 * per internet address. Mirrors web `utils/guestId.ts` (same storage key, same shape).
 */
export const GUEST_ID_KEY = 'natcycle:guestId';

/** What the server accepts (`guestOwner` in server allowanceService.js). */
const USABLE = /^[A-Za-z0-9-]{16,64}$/;

export function isUsableGuestId(id: unknown): id is string {
  return typeof id === 'string' && USABLE.test(id);
}

/** A new id: a UUID where the runtime has one, else web's fallback shape. */
export function newGuestId(
  randomUUID: (() => string) | undefined = globalThis.crypto?.randomUUID?.bind(
    globalThis.crypto,
  ),
  now: () => number = Date.now,
  random: () => number = Math.random,
): string {
  if (randomUUID) {
    try {
      return randomUUID();
    } catch {
      /* fall through */
    }
  }
  return `${now().toString(36)}-${random().toString(36).slice(2)}-${random()
    .toString(36)
    .slice(2)}`;
}

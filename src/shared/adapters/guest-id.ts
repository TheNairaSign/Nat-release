import {
  GUEST_ID_KEY,
  isUsableGuestId,
  newGuestId,
} from '@/core/session/guest-id';
import type { KeyValueStore } from '@/shared/ports/key-value-store';

/**
 * The device's guest id, made once and kept. Storage failing means a fresh id each
 * launch, which the server's per-address limits still hold in check (as on web).
 */
export function createGuestIdSource(kv: KeyValueStore): () => Promise<string> {
  let cached: Promise<string> | null = null;
  return () => {
    cached ??= (async () => {
      try {
        const kept = await kv.get<string>(GUEST_ID_KEY);
        if (isUsableGuestId(kept)) return kept;
        const id = newGuestId();
        await kv.set(GUEST_ID_KEY, id);
        return id;
      } catch {
        return newGuestId();
      }
    })();
    return cached;
  };
}

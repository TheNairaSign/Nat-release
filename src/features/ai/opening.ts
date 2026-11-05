import type { FoodCardOpening } from '@/core/grocery';

/**
 * DiVA's own first message, handed from another screen to the chat (web passes it in the
 * router's state as `initialOptions`). Taken once: the chat clears it as it opens.
 */
let pending: FoodCardOpening | null = null;

export function openDivaWith(opening: FoodCardOpening): void {
  pending = opening;
}

export function takeDivaOpening(): FoodCardOpening | null {
  const opening = pending;
  pending = null;
  return opening;
}

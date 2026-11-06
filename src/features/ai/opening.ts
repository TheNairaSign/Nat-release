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

/**
 * A question to ask as the chat opens, with the context that makes the answer specific
 * (web navigates to /ai with `initialQuestion` and `initialContext`): "How to divert?"
 * on a grocery card, or "Make a recipe". Taken once.
 */
let pendingAsk: { question: string; context?: Record<string, unknown> } | null = null;

export function askDivaWith(question: string, context?: Record<string, unknown>): void {
  pendingAsk = { question, context };
}

export function takeDivaAsk(): { question: string; context?: Record<string, unknown> } | null {
  const ask = pendingAsk;
  pendingAsk = null;
  return ask;
}

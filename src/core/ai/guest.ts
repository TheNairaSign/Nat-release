/**
 * Guests may ask DiVA a few questions before being asked to sign up (web
 * utils/guestDiva.ts). Counted on the device: a nudge, not a lock.
 */
export const GUEST_FREE_QUESTIONS = 3;
export const GUEST_QUESTIONS_KEY = 'natcycle:guestDivaQuestions';

/** "2 free questions left as a guest", or null once they've all been asked. */
export function guestQuestionsLeft(asked: number): string | null {
  const left = GUEST_FREE_QUESTIONS - asked;
  if (left <= 0) return null;
  return `${left} free question${left === 1 ? '' : 's'} left as a guest`;
}

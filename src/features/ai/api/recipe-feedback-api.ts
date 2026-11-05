import type { UseUpRecipe } from '@/core/ai';
import { assertOk } from '@/shared/api';
import type { HttpClient } from '@/shared/ports/http';

/**
 * POST /recipe-feedback: a member's (or guest's) rating of a recipe DiVA gave. Rating
 * the same one again replaces it. Web api/recipeFeedbackApi.ts.
 */
export async function rateRecipe(
  http: HttpClient,
  ref: string,
  recipe: UseUpRecipe,
  rating: number,
  comment = '',
): Promise<void> {
  const response = await http.request({
    path: '/recipe-feedback',
    method: 'POST',
    body: { ref, title: recipe.title, uses: recipe.uses, rating, comment },
  });
  assertOk(response.status, response.body);
}

/** Stable across a reload: the saved time and the title (web AiChat feedbackRef). */
export function recipeFeedbackRef(timestamp: string | undefined, title: string): string {
  const at = timestamp ? new Date(timestamp).getTime() : 0;
  return `${at}:${title}`.slice(0, 100);
}

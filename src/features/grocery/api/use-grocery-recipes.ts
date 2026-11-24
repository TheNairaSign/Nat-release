import { useCallback, useMemo } from 'react';

import type { AiMessage, UseUpRecipe } from '@/core/ai';
import { fetchChatHistory } from '@/features/ai';
import { useQuery, useQueryClient } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';

import type { SavedRecipe } from '../ui/MakeRecipeSheet';

/** DiVA's grocery chat: where every recipe made in Grocery Manager is kept. */
export const groceryRecipesQueryKey = ['ai', 'history', 'grocery'] as const;

/** Newest first; one with no timestamp sorts last. */
function byNewest(a: SavedRecipe, b: SavedRecipe): number {
  const at = a.timestamp ? Date.parse(a.timestamp) : 0;
  const bt = b.timestamp ? Date.parse(b.timestamp) : 0;
  return bt - at;
}

/**
 * Every recipe DiVA has made for this person in Grocery Manager, newest first (web
 * hooks/useGroceryRecipes). They live in the grocery section of DiVA's chat, whether made
 * in the chat or with "Make a recipe", so this reads that history and keeps the messages
 * carrying one.
 */
export function useGroceryRecipes() {
  const { http } = usePorts();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: groceryRecipesQueryKey,
    queryFn: () => fetchChatHistory(http, 'grocery'),
  });

  const recipes = useMemo<SavedRecipe[]>(
    () =>
      (query.data ?? [])
        .filter((m): m is AiMessage & { recipe: UseUpRecipe } => Boolean(m.recipe))
        .map((m) => ({ id: m.id, timestamp: m.timestamp ?? '', recipe: m.recipe }))
        .sort(byNewest),
    [query.data],
  );

  /** A recipe just made goes to the top without reloading the history. */
  const add = useCallback(
    (saved: SavedRecipe) =>
      queryClient.setQueryData<AiMessage[]>(groceryRecipesQueryKey, (prev) => [
        ...(prev ?? []).filter((m) => m.id !== saved.id),
        {
          id: saved.id,
          role: 'assistant',
          text: saved.recipe.title,
          timestamp: saved.timestamp,
          recipe: saved.recipe,
        },
      ]),
    [queryClient],
  );

  return { recipes, loading: query.isPending, add };
}

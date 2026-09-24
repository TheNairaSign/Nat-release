import { fetchDisposeChips } from '@/shared/api/dispose-chips';
import type { HttpRequest, HttpResponse } from '@/shared/ports/http';

import { fetchWhereChips } from '../api/where-api';

/**
 * Web renders the homepage dispose row and the Where chip row from one helper
 * (client/src/utils/disposeMaterialChips.ts). This pins the two mobile entry
 * points to the same source so they can never drift apart again.
 */

/** Shapes taken from the live responses natcycle.app renders its chips from. */
const NATCYCLE_BODY = {
  data: {
    categories: [
      { category: 'Plastic', createdAt: '2024-01-01T00:00:00.000Z' },
      { category: 'Paper', createdAt: '2024-02-01T00:00:00.000Z' },
      { category: 'Fabrics', createdAt: '2024-03-01T00:00:00.000Z' },
    ],
    primaryTypes: ['plastic', 'paper', 'fabrics'],
  },
};

const THINGSMATCH_BODY = {
  data: [
    { category: 'books', createdAt: '2025-10-29T10:43:35.075Z' },
    { category: 'clothes', createdAt: '2025-10-29T10:43:49.113Z' },
    { category: 'shoes', createdAt: '2025-10-29T10:44:05.696Z' },
  ],
};

function routedHttp(
  overrides: { natcycle?: HttpResponse; thingsMatch?: HttpResponse } = {},
) {
  const seen: string[] = [];
  return {
    seen,
    request: async (input: HttpRequest): Promise<HttpResponse> => {
      seen.push(input.path);
      if (input.path.includes('thingsmatch-categories')) {
        return overrides.thingsMatch ?? { status: 200, body: THINGSMATCH_BODY };
      }
      return overrides.natcycle ?? { status: 200, body: NATCYCLE_BODY };
    },
  };
}

describe('Where chips', () => {
  it('returns exactly what the shared dispose-chip source returns', async () => {
    const home = routedHttp();
    const where = routedHttp();
    const [homeChips, whereChips] = await Promise.all([
      fetchDisposeChips(home),
      fetchWhereChips(where),
    ]);
    expect(whereChips).toEqual(homeChips);
    // Regression: Where hit only `/materials/primary-types`, so every
    // ThingsMatch category the homepage offered was missing from the map.
    expect(where.seen.some((p) => p.includes('thingsmatch-categories'))).toBe(
      true,
    );
    expect(whereChips).toContain('Books');
  });
});

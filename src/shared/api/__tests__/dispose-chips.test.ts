import type { HttpRequest, HttpResponse } from '@/shared/ports/http';

import { fetchDisposeChips } from '../dispose-chips';

/**
 * Web builds the homepage dispose row and the Where chip row from one helper
 * (client/src/utils/disposeMaterialChips.ts), so the two rows always carry the
 * same labels in the same order. Where used to fetch `/materials/primary-types`
 * on its own and drop the ThingsMatch half entirely.
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

describe('fetchDisposeChips', () => {
  it('merges NatCycle + ThingsMatch in the order natcycle.app shows', async () => {
    await expect(fetchDisposeChips(routedHttp())).resolves.toEqual([
      'Plastic',
      'Paper',
      'Fabrics',
      'Books',
      'Clothes',
      'Shoes',
    ]);
  });

  it('prefers the rich `categories` rows over bare `primaryTypes`', async () => {
    // `primaryTypes` carries no createdAt, so sorting on it would fall back to
    // alphabetical and reorder the row away from web's.
    const http = routedHttp({ thingsMatch: { status: 500, body: null } });
    await expect(fetchDisposeChips(http)).resolves.toEqual([
      'Plastic',
      'Paper',
      'Fabrics',
    ]);
  });

  it('falls back to `primaryTypes` when `categories` is absent', async () => {
    const http = routedHttp({
      natcycle: { status: 200, body: { data: { primaryTypes: ['glass'] } } },
      thingsMatch: { status: 500, body: null },
    });
    await expect(fetchDisposeChips(http)).resolves.toEqual(['Glass']);
  });

  it('keeps the NatCycle chips when ThingsMatch throws', async () => {
    const http = {
      request: async (input: HttpRequest): Promise<HttpResponse> => {
        if (input.path.includes('thingsmatch-categories')) {
          throw new Error('ThingsMatch down');
        }
        return { status: 200, body: NATCYCLE_BODY };
      },
    };
    await expect(fetchDisposeChips(http)).resolves.toEqual([
      'Plastic',
      'Paper',
      'Fabrics',
    ]);
  });
});

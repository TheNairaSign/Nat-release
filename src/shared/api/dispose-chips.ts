import {
  mergeWhereMaterialChips,
  registerMaterialAliases,
  type MaterialChipInput,
} from '@/core/materials';
import { registerMaterialVisuals } from '@/core/where';
import { getEnv } from '@/shared/config/env';
import type { HttpClient } from '@/shared/ports/http';

/**
 * Single source of truth for the Home dispose chips and the Where material
 * chips — the mobile mirror of `client/src/utils/disposeMaterialChips.ts`.
 *
 * Web builds both rows from one helper, so they always carry the same labels in
 * the same order. Mobile used to fetch them separately: Home merged NatCycle +
 * ThingsMatch, Where fetched only `/materials/primary-types`, which is why the
 * map was missing every ThingsMatch category the homepage offered.
 */

function unwrapList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') return [];
  const root = body as Record<string, unknown>;
  if (Array.isArray(root.categories)) return root.categories;
  if (Array.isArray(root.primaryTypes)) return root.primaryTypes;
  if (Array.isArray(root.data)) return root.data;
  const nested = root.data;
  if (nested && typeof nested === 'object') {
    const data = nested as Record<string, unknown>;
    // Web prefers the rich `categories` rows because they carry `createdAt`,
    // which is what the chip order sorts on; `primaryTypes` is the bare
    // fallback (parseNatcycleMaterials in disposeMaterialChips.ts).
    if (Array.isArray(data.categories) && data.categories.length > 0) {
      return data.categories;
    }
    if (Array.isArray(data.primaryTypes)) return data.primaryTypes;
    if (Array.isArray(data.data)) return data.data;
  }
  return [];
}

function asChipInputs(raw: unknown[]): MaterialChipInput[] {
  return raw.filter(
    (item): item is MaterialChipInput =>
      typeof item === 'string' || (Boolean(item) && typeof item === 'object'),
  );
}

export async function fetchDisposeChips(http: HttpClient): Promise<string[]> {
  const env = getEnv();
  // `allSettled`, like web: a ThingsMatch outage must still leave the NatCycle
  // chips on screen rather than emptying the row.
  const [materials, thingsMatch] = await Promise.allSettled([
    http.request({ path: '/materials/primary-types', method: 'GET' }),
    http.request({
      path: `${env.ursApiUrl}/platforms/natcycle/thingsmatch-categories`,
      method: 'GET',
      headers: { 'X-API-Key': env.ursApiKey },
      token: '',
    }),
  ]);

  let primary: MaterialChipInput[] = [];
  let tm: MaterialChipInput[] = [];

  if (materials.status === 'fulfilled' && materials.value.status < 300) {
    primary = asChipInputs(unwrapList(materials.value.body));
  }
  if (thingsMatch.status === 'fulfilled' && thingsMatch.value.status < 300) {
    tm = asChipInputs(unwrapList(thingsMatch.value.body));
  }

  // Old names ("electronics") resolve to today's chip (E-waste), as web does.
  registerMaterialAliases(
    primary.filter(
      (item): item is Exclude<MaterialChipInput, string> => typeof item === 'object',
    ) as { category?: string; description?: string; aliases?: unknown }[],
  );

  // The rich rows carry URS's icon and colour per material; Where's markers use them,
  // as web does (registerMaterialVisuals in WhereMapbox fetchMaterialCategories).
  registerMaterialVisuals(
    [...primary, ...tm].filter(
      (item): item is Exclude<MaterialChipInput, string> => typeof item === 'object',
    ) as { category?: string; name?: string; iconUrl?: string | null; colorHex?: string | null }[],
  );

  return mergeWhereMaterialChips(primary, tm);
}

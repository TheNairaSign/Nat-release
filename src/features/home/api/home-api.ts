import { z } from 'zod';

import {
  mergeWhereMaterialChips,
  type MaterialChipInput,
} from '@/core/materials';
import { pickRandomSlice } from '@/core/home';
import { getEnv } from '@/shared/config/env';
import type { HttpClient } from '@/shared/ports/http';

const profileSchema = z
  .object({
    firstName: z.string().optional(),
    carbonUnits: z.union([z.number(), z.string()]).optional(),
    isEmailVerified: z.boolean().optional(),
    phoneNumber: z.string().nullable().optional(),
  })
  .passthrough();

export type HomeProfile = {
  firstName?: string;
  carbonUnits: number;
  isEmailVerified: boolean;
  phoneNumber: string | null;
  ready: boolean;
};

export const homeProfileQueryKey = ['home', 'profile'] as const;
export const homeMaterialsQueryKey = ['home', 'materials'] as const;
export const homeSuggestionsQueryKey = ['home', 'suggestions'] as const;

export type HomeSuggestion = {
  id: string;
  text: string;
};

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

export async function fetchHomeProfile(http: HttpClient): Promise<HomeProfile> {
  const response = await http.request({ path: '/profile', method: 'GET' });
  if (response.status < 200 || response.status >= 300) {
    return {
      carbonUnits: 0,
      isEmailVerified: true,
      phoneNumber: null,
      ready: false,
    };
  }
  const parsed = profileSchema.safeParse(response.body ?? {});
  if (!parsed.success) {
    return {
      carbonUnits: 0,
      isEmailVerified: true,
      phoneNumber: null,
      ready: false,
    };
  }
  const dto = parsed.data;
  return {
    firstName: dto.firstName,
    carbonUnits: Number(dto.carbonUnits ?? 0) || 0,
    isEmailVerified: dto.isEmailVerified === true,
    phoneNumber: dto.phoneNumber ?? null,
    ready: true,
  };
}

export async function fetchDisposeChips(http: HttpClient): Promise<string[]> {
  const env = getEnv();
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

  return mergeWhereMaterialChips(primary, tm);
}

const suggestionSchema = z.object({
  _id: z.string(),
  text: z.string(),
});

export async function fetchAiSuggestions(
  http: HttpClient,
  random: () => number = Math.random,
): Promise<HomeSuggestion[]> {
  const env = getEnv();
  const response = await http.request({
    path: `${env.aiApiUrl}/suggestions?activeOnly=true`,
    method: 'GET',
    headers: { 'x-api-key': env.aiApiKey },
    token: '',
  });
  if (response.status < 200 || response.status >= 300) return [];
  const body = response.body as { success?: boolean; data?: unknown } | null;
  if (!body || body.success === false || !Array.isArray(body.data)) return [];
  const parsed = body.data.flatMap((item) => {
    const result = suggestionSchema.safeParse(item);
    return result.success
      ? [{ id: result.data._id, text: result.data.text }]
      : [];
  });
  return pickRandomSlice(parsed, 4, random);
}

export async function requestHomeOtp(http: HttpClient): Promise<boolean> {
  const response = await http.request({
    path: '/auth/request-otp',
    method: 'GET',
  });
  return response.status >= 200 && response.status < 300;
}

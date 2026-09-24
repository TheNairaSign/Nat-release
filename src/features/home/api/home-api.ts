import { z } from 'zod';

import { pickRandomSlice } from '@/core/home';
import { fetchDisposeChips } from '@/shared/api/dispose-chips';
import { unwrapDataObject } from '@/shared/api/unwrap';
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
  // `GET /profile` answers `{ data: { ...user } }`. Web unwraps twice —
  // axios `response.data`, then `res.data` in Dashboard.tsx:66-67 — so the user
  // fields live one level down. Parsing the envelope instead silently yields a
  // profile of all-undefined (every schema field is optional), which is how the
  // dashboard lost its Carbon Units, greeting name and email-verified flag.
  const parsed = profileSchema.safeParse(unwrapDataObject(response.body) ?? {});
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

export { fetchDisposeChips };

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

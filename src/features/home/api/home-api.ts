import { z } from 'zod';

import { parseGroceryItem, soonestFirst, type GroceryItem } from '@/core/grocery';
import { fetchDisposeChips } from '@/shared/api/dispose-chips';
import { unwrapDataObject, unwrapList } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

const profileSchema = z
  .object({
    firstName: z.string().optional(),
    carbonUnits: z.union([z.number(), z.string()]).optional(),
    homeCarbonUnits: z.union([z.number(), z.string()]).optional(),
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
    // Everything they've earned: drop-offs plus home diversion (web totalCarbonUnits).
    carbonUnits:
      (Number(dto.carbonUnits ?? 0) || 0) + (Number(dto.homeCarbonUnits ?? 0) || 0),
    isEmailVerified: dto.isEmailVerified === true,
    phoneNumber: dto.phoneNumber ?? null,
    ready: true,
  };
}

export { fetchDisposeChips };


export async function requestHomeOtp(http: HttpClient): Promise<boolean> {
  const response = await http.request({
    path: '/auth/request-otp',
    method: 'GET',
  });
  return response.status >= 200 && response.status < 300;
}

export const homeGroceriesQueryKey = ['home', 'groceries'] as const;

/**
 * The member's groceries still in the list, soonest expiry first (web
 * useActiveGroceries). Empty when they can't be loaded: Home carries on without them.
 */
export async function fetchActiveGroceries(http: HttpClient): Promise<GroceryItem[]> {
  try {
    const response = await http.request({ path: '/grocery/items?status=active' });
    if (response.status >= 300) return [];
    return soonestFirst(
      unwrapList(response.body).flatMap((row) => {
        const item = parseGroceryItem(row);
        return item ? [item] : [];
      }),
    );
  } catch {
    return [];
  }
}

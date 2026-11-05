import {
  NO_HOME_DIVERSION,
  parseHomeDiversion,
  parseRegularActivity,
  parseSimpleActivity,
  type DropoffActivity,
  type HomeDiversion,
  type MaterialCatalogItem,
} from '@/core/impact';
import { unwrapDataObject, unwrapList } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

export const impactUserQueryKey = ['impact', 'user'] as const;

export async function fetchImpactUser(http: HttpClient): Promise<{
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  carbonUnits: number;
  /** Carbon Units from home diversion (Grocery Manager, SnapDivert). */
  homeCarbonUnits: number;
  createdAt?: string;
  itemsCount: Record<string, number>;
} | null> {
  const response = await http.request({ path: '/profile', method: 'GET' });
  if (response.status >= 300) return null;
  const raw =
    unwrapDataObject(response.body) ??
    (response.body as Record<string, unknown>);
  if (!raw) return null;
  const items =
    raw.itemsCount && typeof raw.itemsCount === 'object'
      ? (raw.itemsCount as Record<string, number>)
      : {};
  const picture = raw.profilePicture;
  const profilePictureUrl =
    picture &&
    typeof picture === 'object' &&
    typeof (picture as { url?: unknown }).url === 'string'
      ? (picture as { url: string }).url
      : typeof raw.profilePictureUrl === 'string'
        ? raw.profilePictureUrl
        : undefined;
  return {
    firstName: typeof raw.firstName === 'string' ? raw.firstName : undefined,
    lastName: typeof raw.lastName === 'string' ? raw.lastName : undefined,
    profilePictureUrl,
    carbonUnits: Number(raw.carbonUnits ?? 0) || 0,
    homeCarbonUnits: Number(raw.homeCarbonUnits ?? 0) || 0,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    itemsCount: items,
  };
}
export const impactDropoffsQueryKey = ['impact', 'dropoffs'] as const;
export const impactMaterialsQueryKey = ['impact', 'materials'] as const;

export async function fetchImpactActivities(
  http: HttpClient,
  userId: string,
): Promise<DropoffActivity[]> {
  const [regular, simple] = await Promise.allSettled([
    http.request({ path: `/dropOff/user/${userId}`, method: 'GET' }),
    http.request({
      path: '/simple-dropoffs/my-dropoffs?page=1&limit=1000',
      method: 'GET',
    }),
  ]);
  const items: DropoffActivity[] = [];
  if (regular.status === 'fulfilled' && regular.value.status < 300) {
    for (const row of unwrapList(regular.value.body)) {
      const parsed = parseRegularActivity(row);
      if (parsed) items.push(parsed);
    }
  }
  if (simple.status === 'fulfilled' && simple.value.status < 300) {
    for (const row of unwrapList(simple.value.body)) {
      const parsed = parseSimpleActivity(row);
      if (parsed) items.push(parsed);
    }
  }
  return items;
}

export async function fetchImpactCatalog(http: HttpClient): Promise<{
  types: string[];
  materials: MaterialCatalogItem[];
}> {
  const [typesRes, materialsRes] = await Promise.allSettled([
    http.request({ path: '/materials/primary-types', method: 'GET' }),
    http.request({ path: '/materials', method: 'GET' }),
  ]);
  const types =
    typesRes.status === 'fulfilled' && typesRes.value.status < 300
      ? unwrapList(typesRes.value.body).filter(
          (item): item is string => typeof item === 'string',
        )
      : [];
  const materials: MaterialCatalogItem[] = [];
  if (materialsRes.status === 'fulfilled' && materialsRes.value.status < 300) {
    for (const row of unwrapList(materialsRes.value.body)) {
      if (!row || typeof row !== 'object') continue;
      const item = row as Record<string, unknown>;
      if (typeof item.category !== 'string') continue;
      materials.push({
        category: item.category,
        cuValue: Number(item.cuValue ?? 0) || 0,
        isActive: item.isActive !== false,
      });
    }
  }
  return { types, materials };
}

export const homeDiversionQueryKey = ['impact', 'home-diversion'] as const;

/** GET /home-diversion; empty when it can't be loaded, so the page still shows. */
export async function fetchHomeDiversion(http: HttpClient): Promise<HomeDiversion> {
  try {
    const response = await http.request({ path: '/home-diversion' });
    if (response.status >= 300) return NO_HOME_DIVERSION;
    return parseHomeDiversion(unwrapDataObject(response.body));
  } catch {
    return NO_HOME_DIVERSION;
  }
}

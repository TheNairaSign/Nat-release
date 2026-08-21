import {
  isMaterialTypeMatch,
  mergeWhereMaterialChips,
  type MaterialChipInput,
} from '@/core/materials';
import {
  formatCampaignHours,
  formatCampaignSchedule,
  getCampaignId,
  getCampaignPhase,
  haversineKm,
  type MapPartner,
  type WhereBranch,
  type WherePlace,
} from '@/core/where';
import { getEnv } from '@/shared/config/env';
import type { HttpClient } from '@/shared/ports/http';

export const whereChipsQueryKey = ['where', 'chips'] as const;
export const wherePlacesQueryKey = ['where', 'places'] as const;
export const wherePartnersQueryKey = ['where', 'partners'] as const;

function unwrapList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') return [];
  const root = body as Record<string, unknown>;
  if (Array.isArray(root.data)) return root.data;
  const nested = root.data;
  if (nested && typeof nested === 'object') {
    const data = nested as Record<string, unknown>;
    if (Array.isArray(data.categories) && data.categories.length > 0)
      return data.categories;
    if (Array.isArray(data.primaryTypes)) return data.primaryTypes;
    if (Array.isArray(data.data)) return data.data;
  }
  if (Array.isArray(root.categories)) return root.categories;
  if (Array.isArray(root.primaryTypes)) return root.primaryTypes;
  return [];
}

function asChipInputs(raw: unknown[]): MaterialChipInput[] {
  return raw.filter(
    (item): item is MaterialChipInput =>
      typeof item === 'string' || (Boolean(item) && typeof item === 'object'),
  );
}

export async function fetchWhereChips(http: HttpClient): Promise<string[]> {
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

function coordsOf(raw: unknown): { lng: number; lat: number } | null {
  if (!raw || typeof raw !== 'object') return null;
  const location = (
    raw as { location?: { coordinates?: unknown }; coordinates?: unknown }
  ).location;
  const pair =
    location?.coordinates ?? (raw as { coordinates?: unknown }).coordinates;
  if (!Array.isArray(pair) || pair.length < 2) return null;
  const lng = Number(pair[0]);
  const lat = Number(pair[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

function idOf(raw: Record<string, unknown>): string | null {
  const id = raw.id ?? raw._id ?? raw.googleMapId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function nameOf(raw: Record<string, unknown>): string {
  return typeof raw.name === 'string' ? raw.name : 'Drop-off';
}

function strings(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === 'string')
    : [];
}

function imagesOf(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (
        item &&
        typeof item === 'object' &&
        'url' in item &&
        typeof item.url === 'string'
      ) {
        return item.url;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function branchesOf(raw: unknown): WhereBranch[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const xy = coordsOf(row);
    if (!xy) return [];
    return [
      {
        name: typeof row.name === 'string' ? row.name : 'Branch',
        address: typeof row.address === 'string' ? row.address : undefined,
        lat: xy.lat,
        lng: xy.lng,
        contactNumber:
          typeof row.contactNumber === 'string' ? row.contactNumber : undefined,
        isActive: row.isActive !== false,
      },
    ];
  });
}

export async function fetchWherePlaces(
  http: HttpClient,
  origin: { latitude: number; longitude: number },
  materialType?: string,
): Promise<WherePlace[]> {
  const itemType = materialType ?? '';
  const [regular, simple, campaigns] = await Promise.allSettled([
    http.request({
      path: `/dropOff-location/nearest/location?latitude=${origin.latitude}&longitude=${origin.longitude}&itemType=${encodeURIComponent(itemType)}`,
      method: 'GET',
    }),
    http.request({
      path: `/simple-dropoff-locations/nearby?latitude=${origin.latitude}&longitude=${origin.longitude}&radius=50000&limit=50&includeInactive=true${
        materialType ? `&materialType=${encodeURIComponent(materialType)}` : ''
      }`,
      method: 'GET',
    }),
    http.request({
      path: `/campaigns/map?latitude=${origin.latitude}&longitude=${origin.longitude}&radius=500000&limit=200`,
      method: 'GET',
    }),
  ]);

  const places: WherePlace[] = [];

  if (regular.status === 'fulfilled' && regular.value.status < 300) {
    for (const row of unwrapList(regular.value.body)) {
      if (!row || typeof row !== 'object') continue;
      const raw = row as Record<string, unknown>;
      const id = idOf(raw);
      const xy = coordsOf(raw);
      if (!id || !xy) continue;
      const primary =
        (typeof raw.primaryMaterialType === 'string' &&
          raw.primaryMaterialType) ||
        (typeof raw.itemType === 'string' && raw.itemType) ||
        '';
      const secondary =
        typeof raw.secondaryMaterialType === 'string'
          ? raw.secondaryMaterialType
          : null;
      if (
        materialType &&
        !isMaterialTypeMatch(materialType, primary, secondary)
      )
        continue;
      places.push({
        kind: 'regular',
        id,
        name: nameOf(raw),
        address: typeof raw.address === 'string' ? raw.address : undefined,
        lat: xy.lat,
        lng: xy.lng,
        organizationName:
          typeof raw.organizationName === 'string'
            ? raw.organizationName
            : undefined,
        materials: [primary, secondary].filter((item): item is string =>
          Boolean(item),
        ),
        record: true,
        tag: 'Center',
        description:
          typeof raw.description === 'string' ? raw.description : undefined,
        website: typeof raw.website === 'string' ? raw.website : undefined,
        images: imagesOf(raw.locationImages),
        acceptedSubtypes: strings(raw.acceptedSubtypes),
        platformClass:
          typeof raw.platformClass === 'string' ? raw.platformClass : 'P1',
        isActive: raw.isActive !== false,
      });
    }
  }

  if (simple.status === 'fulfilled' && simple.value.status < 300) {
    for (const row of unwrapList(simple.value.body)) {
      if (!row || typeof row !== 'object') continue;
      const raw = row as Record<string, unknown>;
      const id = idOf(raw);
      const xy = coordsOf(raw);
      if (!id || !xy) continue;
      const bulk = strings(raw.bulkMaterialTypes);
      const subtypes = strings(raw.acceptedSubtypes);
      if (
        materialType &&
        !isMaterialTypeMatch(materialType, bulk[0], bulk[1], bulk, subtypes)
      ) {
        continue;
      }
      places.push({
        kind: 'simple',
        id,
        name: nameOf(raw),
        address: typeof raw.address === 'string' ? raw.address : undefined,
        lat: xy.lat,
        lng: xy.lng,
        organizationName:
          typeof raw.organizationName === 'string'
            ? raw.organizationName
            : undefined,
        materials: bulk.length > 0 ? bulk : subtypes,
        record: raw.record !== false,
        tag:
          typeof raw.displayTag === 'string' && raw.displayTag
            ? raw.displayTag
            : 'Drop-off',
        images: imagesOf(raw.locationImages),
        acceptedSubtypes: subtypes,
        platformClass:
          typeof raw.platformClass === 'string' ? raw.platformClass : 'P5A',
        isActive: raw.isActive !== false,
        extraLocations: branchesOf(raw.extraLocations),
        paymentNote:
          typeof raw.paymentNote === 'string' ? raw.paymentNote : undefined,
        whoCanDropOff:
          typeof raw.whoCanDropOff === 'string' ? raw.whoCanDropOff : undefined,
        contactNumber:
          typeof raw.contactNumber === 'string' ? raw.contactNumber : undefined,
      });
    }
  }

  if (campaigns.status === 'fulfilled' && campaigns.value.status < 300) {
    for (const row of unwrapList(campaigns.value.body)) {
      if (!row || typeof row !== 'object') continue;
      const raw = row as Record<string, unknown>;
      const id = getCampaignId(raw) ?? idOf(raw);
      const xy = coordsOf(raw);
      if (!id || !xy) continue;
      const materials = strings(raw.materialTypes);
      const campaign = {
        id,
        status: typeof raw.status === 'string' ? raw.status : undefined,
        startDate:
          typeof raw.startDate === 'string' ? raw.startDate : undefined,
        endDate: typeof raw.endDate === 'string' ? raw.endDate : undefined,
        isIndefinite: raw.isIndefinite === true,
        scheduleType:
          typeof raw.scheduleType === 'string' ? raw.scheduleType : undefined,
        openDates: Array.isArray(raw.openDates) ? raw.openDates : undefined,
        timeMode: typeof raw.timeMode === 'string' ? raw.timeMode : undefined,
        sharedTimeSlots: Array.isArray(raw.sharedTimeSlots)
          ? (raw.sharedTimeSlots as { start?: string; end?: string }[])
          : undefined,
      };
      places.push({
        kind: 'campaign',
        id,
        name: nameOf(raw),
        address: typeof raw.address === 'string' ? raw.address : undefined,
        lat: xy.lat,
        lng: xy.lng,
        organizationName:
          typeof raw.organizationName === 'string'
            ? raw.organizationName
            : undefined,
        materials,
        record: false,
        tag: 'Event',
        description:
          typeof raw.description === 'string' ? raw.description : undefined,
        images: imagesOf(raw.image ? [raw.image] : raw.locationImages),
        phase: getCampaignPhase(campaign),
        schedule: formatCampaignSchedule(campaign),
        hours: formatCampaignHours(campaign),
        whoCanAttend:
          typeof raw.whoCanAttend === 'string' ? raw.whoCanAttend : undefined,
        isActive: raw.status !== 'completed' && raw.status !== 'cancelled',
      });
    }
  }

  return places.sort(
    (a, b) =>
      haversineKm(origin.latitude, origin.longitude, a.lat, a.lng) -
      haversineKm(origin.latitude, origin.longitude, b.lat, b.lng),
  );
}

export async function fetchMapPartners(
  http: HttpClient,
): Promise<MapPartner[]> {
  const response = await http.request({
    path: '/company/map-directory',
    method: 'GET',
  });
  if (response.status < 200 || response.status >= 300) return [];
  return unwrapList(response.body).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const id = idOf(row);
    const name = typeof row.name === 'string' ? row.name : null;
    if (!id || !name) return [];
    return [{ id, name }];
  });
}

export async function sendCampaignReminder(
  http: HttpClient,
  campaignId: string,
): Promise<boolean> {
  const response = await http.request({
    path: `/campaigns/${campaignId}/reminder`,
    method: 'POST',
  });
  return response.status >= 200 && response.status < 300;
}

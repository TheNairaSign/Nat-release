import {
  displayMaterials,
  locationAcceptsCanonical,
} from '@/core/materials';
import {
  formatCampaignHours,
  formatCampaignSchedule,
  getCampaignId,
  isCampaignShownOnEventsMap,
  getCampaignPhase,
  haversineKm,
  type MapPartner,
  type WhereBranch,
  type WherePlace,
} from '@/core/where';
import { fetchDisposeChips } from '@/shared/api/dispose-chips';
import { unwrapDataObject } from '@/shared/api/unwrap';
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

export async function fetchWhereChips(http: HttpClient): Promise<string[]> {
  // Exact same fetch, merge and order as the home dispose card — web builds
  // both rows from one helper (client/src/utils/disposeMaterialChips.ts).
  return fetchDisposeChips(http);
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

type EventPoint = { lat: number; lng: number; name?: string; address?: string };

/**
 * Every place an event happens, as web draws them (WhereMapbox campaign markers): each of
 * `locations[]` — a linked simple drop-off, a linked drop-off, or a custom spot — and only
 * when there are none, the event's own `location`. Events built from linked locations have
 * no top-level point at all, which is why they used to vanish from the map.
 */
function eventPointsOf(raw: Record<string, unknown>): EventPoint[] {
  const locations = Array.isArray(raw.locations) ? raw.locations : [];
  const points: EventPoint[] = [];
  for (const entry of locations) {
    if (!entry || typeof entry !== 'object') continue;
    const loc = entry as Record<string, unknown>;
    const linked = [loc.simpleDropoffLocationId, loc.dropoffLocationId].find(
      (value) => value && typeof value === 'object' && coordsOf(value),
    ) as Record<string, unknown> | undefined;
    if (linked) {
      const xy = coordsOf(linked)!;
      points.push({
        ...xy,
        name: typeof linked.name === 'string' ? linked.name : undefined,
        address: typeof linked.address === 'string' ? linked.address : undefined,
      });
      continue;
    }
    const custom = loc.customLocation as Record<string, unknown> | undefined;
    const xy = custom ? coordsOf(custom) : null;
    if (custom && xy) {
      points.push({
        ...xy,
        name: typeof custom.name === 'string' ? custom.name : undefined,
        address: typeof custom.address === 'string' ? custom.address : undefined,
      });
    }
  }
  if (points.length > 0) return points;
  const own = coordsOf(raw);
  return own ? [own] : [];
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
        images: imagesOf(row.images),
        whoCanDropOff:
          typeof row.whoCanDropOff === 'string' ? row.whoCanDropOff : undefined,
        paymentNote: typeof row.paymentNote === 'string' ? row.paymentNote : undefined,
        viewCount: Number(row.viewCount) || 0,
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
  const campaignQuery = materialType
    ? `&materialType=${encodeURIComponent(materialType)}`
    : '';
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
    // Web's Events slide loads the whole catalogue (`catalog: true`), not a radius around
    // the person — a 500km radius left the slide empty for most people.
    http.request({
      path: `/campaigns/map?catalog=true&limit=200${campaignQuery}`,
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
      const fields = {
        primaryMaterialType: primary,
        secondaryMaterialType: secondary,
        itemType: typeof raw.itemType === 'string' ? raw.itemType : null,
      };
      if (materialType && !locationAcceptsCanonical(fields, materialType))
        continue;
      const display = displayMaterials(fields, materialType ?? null);
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
        materials: [display.icon, display.secondary].filter(
          (item): item is string => Boolean(item),
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
      const packageTags = Array.isArray(raw.materialPackageTags)
        ? (raw.materialPackageTags as { material?: string }[])
        : [];
      const fields = {
        bulkMaterialTypes: bulk,
        iconMaterialType:
          typeof raw.iconMaterialType === 'string'
            ? raw.iconMaterialType
            : null,
        materialPackageTags: packageTags,
      };
      if (materialType && !locationAcceptsCanonical(fields, materialType)) {
        continue;
      }
      const display = displayMaterials(fields, materialType ?? null);
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
        materials: [display.icon, display.secondary].filter(
          (item): item is string => Boolean(item),
        ),
        record: raw.record !== false,
        tag:
          typeof raw.displayTag === 'string' && raw.displayTag
            ? raw.displayTag
            : 'Drop-off',
        description:
          typeof raw.description === 'string' ? raw.description : undefined,
        hours:
          typeof raw.operatingHours === 'string'
            ? raw.operatingHours
            : undefined,
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
        bulkMaterials: bulk,
        website: typeof raw.website === 'string' ? raw.website : undefined,
        viewCount: Number(raw.viewCount) || 0,
        maxItemsPerDropOff:
          raw.maxItemsPerDropOff == null || raw.maxItemsPerDropOff === ''
            ? undefined
            : Number(raw.maxItemsPerDropOff),
        maxItemsUnit:
          typeof raw.maxItemsUnit === 'string' && raw.maxItemsUnit.trim()
            ? raw.maxItemsUnit.trim()
            : undefined,
      });
    }
  }

  if (campaigns.status === 'fulfilled' && campaigns.value.status < 300) {
    for (const row of unwrapList(campaigns.value.body)) {
      if (!row || typeof row !== 'object') continue;
      const raw = row as Record<string, unknown>;
      const id = getCampaignId(raw) ?? idOf(raw);
      const [first, ...rest] = eventPointsOf(raw);
      if (!id || !first) continue;
      if (!isCampaignShownOnEventsMap(raw as Parameters<typeof isCampaignShownOnEventsMap>[0])) {
        continue;
      }
      const xy = first;
      const materials = strings(raw.materialTypes);
      if (
        materialType &&
        !locationAcceptsCanonical({ materialTypes: materials }, materialType)
      ) {
        continue;
      }
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
        address:
          xy.address ?? (typeof raw.address === 'string' ? raw.address : undefined),
        lat: xy.lat,
        lng: xy.lng,
        // An event in several places gets a pin at each, the same way a drop-off's
        // branches do; tapping any opens the event.
        extraLocations: rest.map((point, index) => ({
          name: point.name ?? `Location ${index + 2}`,
          address: point.address,
          lat: point.lat,
          lng: point.lng,
          isActive: true,
        })),
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
        // Events carry a phone and a payment note since Nov 2 (web d3832fd).
        contactNumber:
          typeof raw.contactPhone === 'string' && raw.contactPhone.trim()
            ? raw.contactPhone.trim()
            : undefined,
        paymentNote:
          typeof raw.paymentNote === 'string' && raw.paymentNote.trim()
            ? raw.paymentNote.trim()
            : undefined,
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

/** "I'll attend": whether they're going, and how many are (web CampaignApi). */
export type CampaignAttendance = { count: number; attending: boolean };

function attendanceFrom(body: unknown): CampaignAttendance {
  const data = unwrapDataObject(body) ?? {};
  return {
    count: Number(data.count) || 0,
    attending: data.attending === true,
  };
}

export async function fetchAttendance(
  http: HttpClient,
  campaignId: string,
): Promise<CampaignAttendance> {
  const response = await http.request({
    path: `/campaigns/${encodeURIComponent(campaignId)}/attendance`,
  });
  if (response.status >= 300) throw new Error(`HTTP ${response.status}`);
  return attendanceFrom(response.body);
}

/** Going (POST) or not going after all (DELETE). */
export async function setAttending(
  http: HttpClient,
  campaignId: string,
  going: boolean,
): Promise<CampaignAttendance> {
  const response = await http.request({
    path: `/campaigns/${encodeURIComponent(campaignId)}/attend`,
    method: going ? 'POST' : 'DELETE',
  });
  if (response.status >= 300) throw new Error(`HTTP ${response.status}`);
  return attendanceFrom(response.body);
}

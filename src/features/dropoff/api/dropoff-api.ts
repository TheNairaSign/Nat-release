import { haversineKm } from '@/core/where';
import type { MaterialCatalogEntry } from '@/core/dropoff';
import { unwrapList } from '@/shared/api/unwrap';
import type { CapturedImage } from '@/shared/ports/camera';
import type { HttpClient } from '@/shared/ports/http';

export type SimpleSite = {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  km?: number;
  materials: string[];
  subtypes: string[];
};

export type EventSite = {
  id: string;
  name: string;
  description?: string;
  materials: string[];
  locations: { name: string; address?: string; lat?: number; lng?: number }[];
  ended: boolean;
};

function idOf(raw: Record<string, unknown>): string | null {
  const id = raw.id ?? raw._id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function coords(
  raw: Record<string, unknown>,
): { lat: number; lng: number } | null {
  const location = raw.location as { coordinates?: unknown } | undefined;
  const pair = location?.coordinates ?? raw.coordinates;
  if (!Array.isArray(pair) || pair.length < 2) return null;
  const lng = Number(pair[0]);
  const lat = Number(pair[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function fetchSimpleSites(
  http: HttpClient,
  origin?: { latitude: number; longitude: number } | null,
  materialType?: string,
): Promise<SimpleSite[]> {
  const nearby = origin
    ? await http.request({
        path: `/simple-dropoff-locations/nearby?latitude=${origin.latitude}&longitude=${origin.longitude}&radius=50000&limit=50`,
        method: 'GET',
      })
    : { status: 500, body: null };
  const response =
    nearby.status < 300
      ? nearby
      : await http.request({
          path: '/simple-dropoff-locations/all',
          method: 'GET',
        });
  if (response.status >= 300) return [];
  return unwrapList(response.body).flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const raw = row as Record<string, unknown>;
    if (raw.isActive === false || raw.record === false) return [];
    const id = idOf(raw);
    const xy = coords(raw);
    if (!id || !xy) return [];
    const materials = Array.isArray(raw.bulkMaterialTypes)
      ? raw.bulkMaterialTypes.filter(
          (item): item is string => typeof item === 'string',
        )
      : [];
    const subtypes = Array.isArray(raw.acceptedSubtypes)
      ? raw.acceptedSubtypes.filter(
          (item): item is string => typeof item === 'string',
        )
      : [];
    if (
      materialType &&
      materials.length > 0 &&
      !materials.some((item) => item.toLowerCase() === 'all') &&
      !materials.some(
        (item) => item.toLowerCase() === materialType.toLowerCase(),
      )
    ) {
      return [];
    }
    return [
      {
        id,
        name: typeof raw.name === 'string' ? raw.name : 'Drop-off',
        address: typeof raw.address === 'string' ? raw.address : undefined,
        lat: xy.lat,
        lng: xy.lng,
        km: origin
          ? haversineKm(origin.latitude, origin.longitude, xy.lat, xy.lng)
          : undefined,
        materials,
        subtypes,
      },
    ];
  });
}

export async function fetchEventSites(
  http: HttpClient,
  includeEnded: boolean,
): Promise<EventSite[]> {
  const response = await http.request({
    path: '/campaigns?limit=100&sortBy=endDate&sortOrder=desc',
    method: 'GET',
  });
  if (response.status >= 300) return [];
  return unwrapList(response.body).flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const raw = row as Record<string, unknown>;
    if (raw.status === 'cancelled') return [];
    const ended = raw.status === 'completed' || raw.status === 'ended';
    if (!includeEnded && ended) return [];
    if (!includeEnded && raw.status && raw.status !== 'active') return [];
    const id = idOf(raw);
    if (!id) return [];
    const locations = Array.isArray(raw.locations)
      ? raw.locations.flatMap((item) => {
          if (!item || typeof item !== 'object') return [];
          const loc = item as Record<string, unknown>;
          return [
            {
              name: typeof loc.name === 'string' ? loc.name : 'Site',
              address:
                typeof loc.address === 'string' ? loc.address : undefined,
            },
          ];
        })
      : [];
    if (locations.length === 0) {
      locations.push({
        name: typeof raw.address === 'string' ? raw.address : 'Event location',
        address: undefined,
      });
    }
    return [
      {
        id,
        name: typeof raw.name === 'string' ? raw.name : 'Event',
        description:
          typeof raw.description === 'string' ? raw.description : undefined,
        materials: Array.isArray(raw.materialTypes)
          ? raw.materialTypes.filter(
              (item): item is string => typeof item === 'string',
            )
          : [],
        locations,
        ended,
      },
    ];
  });
}

function filePart(photo: CapturedImage) {
  return {
    uri: photo.uri,
    name: photo.fileName,
    type: photo.mimeType,
  };
}

export async function submitSimpleDropoff(
  http: HttpClient,
  input: {
    locationId: string;
    materialType: string;
    quantity: number;
    latitude: number;
    longitude: number;
    photo: CapturedImage;
    dropOffDate?: string;
  },
): Promise<{ ok: boolean; carbonUnits: number }> {
  const form = new FormData();
  form.append('simpleDropOffLocationId', input.locationId);
  form.append('materialType', input.materialType);
  form.append('quantity', String(input.quantity));
  form.append('latitude', String(input.latitude));
  form.append('longitude', String(input.longitude));
  if (input.dropOffDate) form.append('dropOffDate', input.dropOffDate);
  form.append('file', filePart(input.photo) as unknown as Blob);
  const response = await http.request({
    path: '/simple-dropoffs',
    method: 'POST',
    body: form,
    form: true,
  });
  const body = response.body as {
    cuEarned?: number;
    carbonUnits?: number;
  } | null;
  return {
    ok: response.status >= 200 && response.status < 300,
    carbonUnits: Number(body?.cuEarned ?? body?.carbonUnits ?? 0) || 0,
  };
}

export async function fetchMaterialCatalog(
  http: HttpClient,
): Promise<MaterialCatalogEntry[]> {
  const response = await http.request({ path: '/materials', method: 'GET' });
  if (response.status >= 300) return [];
  const out: MaterialCatalogEntry[] = [];
  for (const row of unwrapList(response.body)) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    if (typeof item.category !== 'string') continue;
    out.push({
      category: item.category,
      cuValue: Number(item.cuValue ?? 0) || 0,
    });
  }
  return out;
}

export async function submitCampaignDropoff(
  http: HttpClient,
  input: {
    campaignId: string;
    materialType: string;
    quantity: number;
    latitude: number;
    longitude: number;
    photo: CapturedImage;
    dropOffDate?: string;
    campaignLocationIndex?: number;
  },
): Promise<{ ok: boolean; carbonUnits: number }> {
  const form = new FormData();
  form.append('materialType', input.materialType);
  form.append(
    'dropOffQuantity',
    JSON.stringify([
      { materialType: input.materialType, units: input.quantity },
    ]),
  );
  form.append('latitude', String(input.latitude));
  form.append('longitude', String(input.longitude));
  form.append(
    'description',
    input.dropOffDate ? 'Event drop-off' : 'Campaign dropoff',
  );
  form.append(
    'campaignLocationIndex',
    String(input.campaignLocationIndex ?? 0),
  );
  if (input.dropOffDate) form.append('dropOffDate', input.dropOffDate);
  form.append('file', filePart(input.photo) as unknown as Blob);
  const response = await http.request({
    path: `/campaigns/${input.campaignId}/dropoff`,
    method: 'POST',
    body: form,
    form: true,
  });
  const body = response.body as {
    carbonUnits?: number;
    pointsEarned?: number;
  } | null;
  return {
    ok: response.status >= 200 && response.status < 300,
    carbonUnits: Number(body?.carbonUnits ?? body?.pointsEarned ?? 0) || 0,
  };
}

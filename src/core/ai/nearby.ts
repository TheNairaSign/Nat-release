/**
 * The nearest NatCycle drop-offs and events for a material, as DiVA's advice card shows
 * them. Mirrors web utils/nearestDropoffs.ts, nearestEvents.ts and distance.ts (main
 * 964a78a); the fetching is in features/ai/api, the choosing is here.
 */
import {
  locationAcceptsCanonical,
  fieldMatchesMaterial,
  type LocationMaterialFields,
} from '@/core/materials';
import { haversineKm } from '@/core/where';

/** Further than this isn't "near you" for a single item (web MAX_KM). */
export const NEARBY_MAX_KM = 50;

type Coords = { latitude: number; longitude: number };

export type NearbyDropoff = {
  id: string;
  /** Which kind of NatCycle location: they live in different collections. */
  kind: 'simple' | 'regular';
  name: string;
  address: string | null;
  distanceKm: number;
  latitude: number;
  longitude: number;
};

export type NearbyEvent = {
  id: string;
  /** Where it's held: the event site nearest the person. */
  placeName: string | null;
  name: string;
  distanceKm: number;
  startDate: string;
  endDate: string | null;
  isIndefinite: boolean;
};

export type RawLocation = LocationMaterialFields & {
  _id?: string;
  id?: string;
  name?: string;
  address?: string;
  location?: { coordinates?: number[] };
};

export type RawEvent = {
  _id?: string;
  name?: string;
  status?: string;
  isHidden?: boolean;
  isIndefinite?: boolean;
  startDate?: string;
  endDate?: string | null;
  materialTypes?: string[] | string;
  locations?: {
    customLocation?: { coordinates?: number[]; name?: string; address?: string };
  }[];
};

const MILES_PER_KM = 0.621371;

/** A distance in miles, as web's formatDistance (most users are in the US). */
export function formatDistance(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return '';
  const miles = km * MILES_PER_KM;
  if (miles < 0.1) {
    return `${Math.max(10, Math.round((miles * 5280) / 10) * 10)} ft`;
  }
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

function toDropoff(
  raw: RawLocation,
  from: Coords,
  kind: NearbyDropoff['kind'],
): NearbyDropoff | null {
  const [lng, lat] = raw.location?.coordinates ?? [];
  if (typeof lat !== 'number' || typeof lng !== 'number' || !raw.name) {
    return null;
  }
  return {
    // Simple drop-offs come back with `id`, regular ones with `_id`.
    id: String(raw.id ?? raw._id ?? `${raw.name}-${lat}-${lng}`),
    kind,
    name: raw.name.trim(),
    address: raw.address?.trim() || null,
    // Measured here: the API's own distance field isn't reliable.
    distanceKm: haversineKm(from.latitude, from.longitude, lat, lng),
    latitude: lat,
    longitude: lng,
  };
}

/** The closest of both kinds that take the material, nearest first, de-duplicated. */
export function pickNearestDropoffs(
  simple: RawLocation[],
  regular: RawLocation[],
  material: string,
  from: Coords,
  limit = 3,
): NearbyDropoff[] {
  const tagged: [RawLocation, NearbyDropoff['kind']][] = [
    ...simple.map((loc): [RawLocation, NearbyDropoff['kind']] => [loc, 'simple']),
    ...regular.map((loc): [RawLocation, NearbyDropoff['kind']] => [loc, 'regular']),
  ];
  const seen = new Set<string>();
  return (
    tagged
      // The check the Where map uses, so the card never names a place the map wouldn't.
      .filter(([loc]) => locationAcceptsCanonical(loc, material))
      .map(([loc, kind]) => toDropoff(loc, from, kind))
      .filter(
        (loc): loc is NearbyDropoff =>
          loc !== null && loc.distanceKm <= NEARBY_MAX_KM,
      )
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .filter((loc) => {
        const key = `${loc.name.toLowerCase()}|${(loc.address ?? '').toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit)
  );
}

function upcoming(raw: RawEvent, now: Date): boolean {
  if (raw.status && raw.status !== 'active') return false;
  if (raw.isHidden) return false;
  if (raw.isIndefinite || !raw.endDate) return true;
  return new Date(raw.endDate).getTime() >= now.getTime();
}

function takesMaterial(raw: RawEvent, material: string): boolean {
  const types = Array.isArray(raw.materialTypes)
    ? raw.materialTypes
    : raw.materialTypes
      ? [raw.materialTypes]
      : [];
  return types.some((type) => fieldMatchesMaterial(type, material));
}

function toEvent(raw: RawEvent, from: Coords): NearbyEvent | null {
  if (!raw._id || !raw.name || !raw.startDate) return null;
  let nearest: { km: number; name: string | null } | null = null;
  for (const site of raw.locations ?? []) {
    const [lng, lat] = site.customLocation?.coordinates ?? [];
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    const km = haversineKm(from.latitude, from.longitude, lat, lng);
    if (!nearest || km < nearest.km) {
      nearest = {
        km,
        name:
          site.customLocation?.name?.trim() ||
          site.customLocation?.address?.trim() ||
          null,
      };
    }
  }
  if (!nearest) return null;
  return {
    id: raw._id,
    name: raw.name.trim(),
    placeName: nearest.name,
    distanceKm: nearest.km,
    startDate: raw.startDate,
    endDate: raw.endDate ?? null,
    isIndefinite: Boolean(raw.isIndefinite),
  };
}

/** Upcoming events that take the material, nearest first. */
export function pickNearestEvents(
  raw: RawEvent[],
  material: string,
  from: Coords,
  now = new Date(),
  limit = 3,
): NearbyEvent[] {
  return raw
    .filter((event) => upcoming(event, now) && takesMaterial(event, material))
    .map((event) => toEvent(event, from))
    .filter(
      (event): event is NearbyEvent =>
        event !== null && event.distanceKm <= NEARBY_MAX_KM,
    )
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/** "On now · until Oct 17", "Sat, Oct 25", or "Ongoing" (dates are UTC midnight). */
export function eventWhen(event: NearbyEvent, now = new Date()): string {
  if (event.isIndefinite) return 'Ongoing';
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  if (start.getTime() <= now.getTime()) {
    return end
      ? `On now · until ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
      : 'On now';
  }
  return start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** This place's card on the Where map (web wherePlaceUrl). */
export function wherePlaceHref(place: NearbyDropoff, material: string): string {
  const q = [
    `materialType=${encodeURIComponent(material)}`,
    `locationId=${encodeURIComponent(place.id)}`,
    `locationKind=${place.kind}`,
  ].join('&');
  return `/where?${q}`;
}

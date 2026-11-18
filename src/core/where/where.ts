export const DEFAULT_MAP_CENTER = {
  latitude: 41.2705,
  longitude: -72.947,
} as const;

export const WHERE_FILTERS = [
  { id: 'all', label: 'All locations' },
  { id: 'static', label: 'Facilities' },
  { id: 'simple', label: 'Quick drop-offs' },
  { id: 'mobile', label: 'Waste events' },
] as const;

export type WhereFilterId = (typeof WHERE_FILTERS)[number]['id'];
export type MapPanelFocus = 'points' | 'events';
export type WherePlaceKind = 'regular' | 'simple' | 'campaign';
export type CampaignPhase = 'live' | 'upcoming' | 'ended';

export type WhereBranch = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  contactNumber?: string;
  isActive: boolean;
  /** Branch photos. The backend carries these on
   *  `simpleDropOffLocation.extraLocations[].images` ({ public_id, url }),
   *  and web prefers them over the parent location's images. */
  images?: string[];
  /** A branch's own terms; web falls back to the main location's payment note. */
  whoCanDropOff?: string;
  paymentNote?: string;
  viewCount?: number;
};

export type WherePlace = {
  kind: WherePlaceKind;
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  organizationName?: string;
  materials: string[];
  record: boolean;
  tag?: string;
  description?: string;
  website?: string;
  images?: string[];
  acceptedSubtypes?: string[];
  platformClass?: string;
  isActive?: boolean;
  extraLocations?: WhereBranch[];
  paymentNote?: string;
  whoCanDropOff?: string;
  contactNumber?: string;
  phase?: CampaignPhase;
  schedule?: string;
  hours?: string;
  whoCanAttend?: string;
  /** Simple drop-offs: every material they take (the card lists them; `materials` is
   *  just the two the marker shows). */
  bulkMaterials?: string[];
  /** How many times the place's card has been opened (shown when it's unavailable). */
  viewCount?: number;
  /** "Per drop-off" limit, e.g. 5 bags. */
  maxItemsPerDropOff?: number;
  maxItemsUnit?: string;
};

export type MapPartner = {
  id: string;
  name: string;
};

export function createDropoffHref(input: {
  type?: string;
  mode?: 'simple';
  locationId?: string;
}): string {
  const params = new URLSearchParams();
  if (input.type) params.set('type', input.type);
  if (input.mode) params.set('mode', input.mode);
  if (input.locationId) params.set('locationId', input.locationId);
  const query = params.toString();
  return query ? `/dropoff/create?${query}` : '/dropoff/create';
}

export function recordMaterialType(place: WherePlace): string {
  const first = place.materials[0];
  if (!first || first.toLowerCase() === 'all') return 'plastic';
  return first;
}

export function directionsUrl(
  platform: 'ios' | 'android',
  lat: number,
  lng: number,
  name: string,
): string {
  const encodedName = encodeURIComponent(name);
  if (platform === 'ios') {
    return `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodedName}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedName}&travelmode=driving`;
}

export function formatDistanceKm(km?: number | null): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Counted within 15 miles of the person (web MapTopPanel, Oct 29). */
export function eventsLabel(count: number): string {
  if (count === 0) return 'No events close to you';
  return `${count} event${count === 1 ? '' : 's'} near you`;
}

/**
 * Web (Nov 18): under Diversion Points, "4 events nearby take metal →" when a material
 * is picked; tapping it opens Events, which is already narrowed to that material.
 */
export function materialEventsPill(count: number, material: string): string {
  return `${count} event${count === 1 ? '' : 's'} nearby take ${material.toLowerCase()} →`;
}

/** The Events card's count while a material is picked: web's "4 nearby take metal". */
export function materialEventsLabel(count: number, material: string): string {
  return `${count === 0 ? 'None' : count} nearby take ${material.toLowerCase()}`;
}

/** Events further than this aren't "near you" (web WhereMapbox NEAR_EVENT_MILES). */
export const NEAR_EVENT_KM = 15 * 1.609344;

/** Events with a site within 15 miles; all of them when we don't know where they are. */
export function nearEventsCount(
  places: { kind: string; lat: number; lng: number }[],
  origin: { latitude: number; longitude: number } | null,
): number {
  const events = places.filter((p) => p.kind === 'campaign');
  if (!origin) return events.length;
  return events.filter(
    (p) => haversineKm(origin.latitude, origin.longitude, p.lat, p.lng) <= NEAR_EVENT_KM,
  ).length;
}

const MILES_PER_KM = 0.621371;

/** A distance in miles, as web's utils/distance.ts (most users are in the US). */
export function formatDistance(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return '';
  const miles = km * MILES_PER_KM;
  if (miles < 0.1) {
    return `${Math.max(10, Math.round((miles * 5280) / 10) * 10)} ft`;
  }
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function filterPlaces(
  places: WherePlace[],
  input: {
    organization: string | null;
    platform: WhereFilterId;
    focus: MapPanelFocus;
  },
): WherePlace[] {
  return places.filter((place) => {
    if (input.organization) {
      const org = place.organizationName?.toLowerCase() ?? '';
      if (org !== input.organization.toLowerCase()) return false;
    }
    if (input.focus === 'events') return place.kind === 'campaign';
    if (input.platform === 'mobile') return place.kind === 'campaign';
    if (place.kind === 'campaign') return false;
    if (input.platform === 'static' && place.kind !== 'regular') return false;
    if (input.platform === 'simple' && place.kind !== 'simple') return false;
    return true;
  });
}

/** How many places the empty search lists, closest first (web nearbyResults). */
export const NEARBY_RESULTS_LIMIT = 40;

/**
 * Web useLocationSearch: every word of the query must appear somewhere in the place's
 * name, address, organisation or materials ("plastic hartford" finds a Hartford plastic
 * drop-off), and results come nearest first. With no query, the 40 closest places.
 */
export function searchPlaces(
  places: WherePlace[],
  query: string,
  origin?: { latitude: number; longitude: number } | null,
): WherePlace[] {
  const byDistance = (list: WherePlace[]) => {
    if (!origin) return list;
    const distance = (place: WherePlace) =>
      haversineKm(origin.latitude, origin.longitude, place.lat, place.lng);
    return [...list].sort((a, b) => distance(a) - distance(b));
  };
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return byDistance(places).slice(0, NEARBY_RESULTS_LIMIT);
  const matches = places.filter((place) => {
    const text = [place.name, place.address, place.organizationName, ...place.materials]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return words.every((word) => text.includes(word));
  });
  return byDistance(matches);
}

export function pickPlaceById(
  places: WherePlace[],
  locationId?: string,
): WherePlace | null {
  if (!locationId) return null;
  return places.find((place) => place.id === locationId) ?? null;
}

export function markerSizeForZoom(zoom: number, highlighted: boolean): number {
  const ref = 12.5;
  const scale = Math.min(1.18, Math.max(0.62, 2 ** ((zoom - ref) * 0.4)));
  const base = highlighted ? 56 : 45;
  return Math.max(28, Math.round(base * scale));
}

/**
 * Badge text for a search result, from `getLocationTypeLabel` in
 * client/src/pages/dashboard/where/components/LocationSearchBar.tsx.
 *
 * Simple drop-offs show their display tag when they have one, otherwise
 * "Drop-off". Without this the raw `kind` enum ("regular", "simple",
 * "campaign") was rendering straight into the UI.
 */
export function searchTypeLabel(place: WherePlace): string {
  if (place.kind === 'simple') {
    const tag = place.tag?.trim();
    return tag ? tag : 'Drop-off';
  }
  if (place.kind === 'regular') return 'Center';
  if (place.kind === 'campaign') return 'Event';
  return place.kind;
}

export type OrganizationResult = {
  id: string;
  name: string;
  locationCount: number;
};

/**
 * Organisations matching a query, aggregated from the loaded places —
 * `organizationResults` in client/src/pages/dashboard/where/hooks/useLocationSearch.ts:143-172.
 *
 * Derived entirely client-side (no endpoint): each distinct `organizationName`
 * whose text matches becomes one row, counting how many places it owns.
 * Returns nothing for an empty query, as web does.
 */
export function searchOrganizations(
  places: WherePlace[],
  query: string,
): OrganizationResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const map = new Map<string, OrganizationResult>();
  for (const place of places) {
    const name = place.organizationName;
    if (!name || !name.toLowerCase().includes(q)) continue;
    const existing = map.get(name);
    if (existing) existing.locationCount += 1;
    else map.set(name, { id: name, name, locationCount: 1 });
  }
  return Array.from(map.values());
}

/**
 * Material types matching a query — web's `materialTypeResults`, a plain
 * substring filter over the known material chips.
 */
export function searchMaterialTypes(
  materialTypes: string[],
  query: string,
): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return materialTypes.filter((type) => type.toLowerCase().includes(q));
}

export type WherePin = {
  /** Stable marker key: `<placeId>` for the main site, `<placeId>::<i>` for a branch. */
  key: string;
  placeId: string;
  /** null for the main site, otherwise the index into `extraLocations`. */
  branchIndex: number | null;
  lat: number;
  lng: number;
  inactive: boolean;
};

/**
 * One pin per site **and one per branch**, mirroring WhereMapbox.tsx, which
 * pushes a `simple-<id>-main` marker and then a `simple-<id>-extra-<i>`
 * marker for every entry in `extraLocations`.
 *
 * Mobile previously drew only the main site. Against production data around
 * Port Harcourt that was 39 pins where web drew 304 — 13 locations carry 265
 * branches between them — which is why the map looked nearly empty.
 *
 * A branch is inactive when either it or its parent is (web's
 * `extraInactive`). Branches only exist on simple drop-off locations.
 */
export function wherePins(places: WherePlace[]): WherePin[] {
  const pins: WherePin[] = [];
  for (const place of places) {
    pins.push({
      key: place.id,
      placeId: place.id,
      branchIndex: null,
      lat: place.lat,
      lng: place.lng,
      inactive: place.isActive === false,
    });
    (place.extraLocations ?? []).forEach((branch, index) => {
      pins.push({
        key: `${place.id}::${index}`,
        placeId: place.id,
        branchIndex: index,
        lat: branch.lat,
        lng: branch.lng,
        inactive: place.isActive === false || branch.isActive === false,
      });
    });
  }
  return pins;
}

/**
 * Zoomed far out (several states in view), icons are a mess: below this, unselected
 * places draw as small dots (web markerZoomScale DOT_MARKER_MAX_ZOOM).
 */
export const DOT_MARKER_MAX_ZOOM = 7.5;

/** About a kilometre: a frame round one event doesn't zoom in to street level. */
const MIN_FRAME_SPAN = 0.01;

/**
 * The box round the events within 15 miles, for the events card to show them (web
 * centerOnCampaigns). Null when there are none near: the map stays on the person and
 * the card says "No events close to you".
 */
export function nearEventsFrame(
  places: { kind: string; lat: number; lng: number }[],
  origin: { latitude: number; longitude: number },
): { ne: [number, number]; sw: [number, number] } | null {
  const near = places.filter(
    (p) =>
      p.kind === 'campaign' &&
      haversineKm(origin.latitude, origin.longitude, p.lat, p.lng) <= NEAR_EVENT_KM,
  );
  if (near.length === 0) return null;
  let minLat = Math.min(...near.map((p) => p.lat));
  let maxLat = Math.max(...near.map((p) => p.lat));
  let minLng = Math.min(...near.map((p) => p.lng));
  let maxLng = Math.max(...near.map((p) => p.lng));
  if (maxLat - minLat < MIN_FRAME_SPAN) {
    const mid = (maxLat + minLat) / 2;
    minLat = mid - MIN_FRAME_SPAN / 2;
    maxLat = mid + MIN_FRAME_SPAN / 2;
  }
  if (maxLng - minLng < MIN_FRAME_SPAN) {
    const mid = (maxLng + minLng) / 2;
    minLng = mid - MIN_FRAME_SPAN / 2;
    maxLng = mid + MIN_FRAME_SPAN / 2;
  }
  return { ne: [maxLng, maxLat], sw: [minLng, minLat] };
}

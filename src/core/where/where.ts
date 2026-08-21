export const DEFAULT_MAP_CENTER = {
  latitude: 41.2705,
  longitude: -72.947,
} as const;

export const WHERE_FILTERS = [
  { id: 'all', label: 'All locations' },
  { id: 'static', label: 'Facilities' },
  { id: 'simple', label: 'Static drop-offs' },
  { id: 'mobile', label: 'Waste events' },
] as const;

export type WhereFilterId = (typeof WHERE_FILTERS)[number]['id'];
export type MapPanelFocus = 'points' | 'events';
export type WherePlaceKind = 'regular' | 'simple' | 'campaign';
export type CampaignPhase = 'live' | 'upcoming' | 'ended';
export type MarkerShape = 'squircle' | 'circle' | 'calendar';

export type WhereBranch = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  contactNumber?: string;
  isActive: boolean;
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

export function eventsLabel(count: number): string {
  if (count === 0) return 'No events';
  return `${count} event${count === 1 ? '' : 's'}`;
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

export function searchPlaces(
  places: WherePlace[],
  query: string,
): WherePlace[] {
  const q = query.trim().toLowerCase();
  if (!q) return places;
  return places.filter((place) => {
    if (place.name.toLowerCase().includes(q)) return true;
    if (place.address?.toLowerCase().includes(q)) return true;
    if (place.organizationName?.toLowerCase().includes(q)) return true;
    return place.materials.some((material) =>
      material.toLowerCase().includes(q),
    );
  });
}

export function pickPlaceById(
  places: WherePlace[],
  locationId?: string,
): WherePlace | null {
  if (!locationId) return null;
  return places.find((place) => place.id === locationId) ?? null;
}

export function markerShapeForPlace(place: WherePlace): MarkerShape {
  if (place.kind === 'campaign') return 'calendar';
  if (place.kind === 'simple') return 'circle';
  return 'squircle';
}

const MATERIAL_COLORS: { keys: string[]; color: string }[] = [
  { keys: ['plastic', 'pet', 'hdpe', 'bottle'], color: '#3b82f6' },
  { keys: ['paper', 'cardboard', 'book'], color: '#f59e0b' },
  { keys: ['fabric', 'textile', 'cloth', 'shoe', 'clothes'], color: '#8b5cf6' },
  { keys: ['glass'], color: '#14b8a6' },
  { keys: ['aluminium', 'aluminum', 'can'], color: '#94a3b8' },
  { keys: ['organic', 'food', 'compost'], color: '#65a30d' },
  { keys: ['electronic', 'ewaste', 'e-waste', 'phone'], color: '#ef4444' },
  { keys: ['metal', 'steel'], color: '#64748b' },
  { keys: ['hazard', 'toxic', 'chemical'], color: '#F5D74D' },
  { keys: ['campaign', 'event'], color: '#e11d48' },
];

export function markerColorForPlace(place: WherePlace): string {
  if (place.kind === 'campaign') {
    if (place.phase === 'upcoming') return '#F5D74D';
    if (place.phase === 'ended') return '#9ca3af';
    return '#e11d48';
  }
  const hay = place.materials.join(' ').toLowerCase();
  const match = MATERIAL_COLORS.find((row) =>
    row.keys.some((key) => hay.includes(key)),
  );
  return match?.color ?? '#16a34a';
}

export function markerSizeForZoom(zoom: number, highlighted: boolean): number {
  const ref = 12.5;
  const scale = Math.min(1.18, Math.max(0.62, 2 ** ((zoom - ref) * 0.4)));
  const base = highlighted ? 56 : 45;
  return Math.max(28, Math.round(base * scale));
}

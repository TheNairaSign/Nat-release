export type DropoffActivity = {
  id: string;
  kind: 'regular' | 'simple' | 'campaign';
  name: string;
  materialType?: string;
  quantity: number;
  carbonUnits: number;
  status?: string;
  campaign?: boolean;
  at: string;
  lat?: number;
  lng?: number;
};

export type MaterialCatalogItem = {
  category: string;
  cuValue: number;
  isActive: boolean;
};

export type MaterialContribution = {
  materialType: string;
  label: string;
  totalQuantity: number;
  totalDropoffs: number;
  carbonUnits: number;
  lastDropoff?: string;
};

export function activityDayKey(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function sinceLabel(createdAt?: string): string {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return `Since ${date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
}

export function impactStats(items: DropoffActivity[], carbonUnits: number) {
  const events = items.filter(
    (item) => item.kind === 'campaign' || item.campaign,
  ).length;
  const dropoffs = items.filter(
    (item) => item.kind !== 'campaign' && !item.campaign,
  ).length;
  return { dropoffs, events, bcu: Math.floor(carbonUnits || 0) };
}

export function materialLabel(materialType: string): string {
  const labels: Record<string, string> = {
    plastic: 'Plastic',
    fabric: 'Fabric',
    glass: 'Glass',
    mixed: 'Mixed',
    organic: 'Organic',
    paper: 'Paper',
    books: 'Books',
    metal: 'Metal',
    ewaste: 'Electronic Waste',
    aluminium: 'Aluminum',
  };
  const key = materialType.toLowerCase();
  return (
    labels[key] ?? materialType.charAt(0).toUpperCase() + materialType.slice(1)
  );
}

export function materialUnit(materialType: string): string {
  const key = materialType.toLowerCase();
  if (key === 'fabric') return 'Lbs';
  if (key === 'glass') return 'lb';
  if (key === 'paper' || key === 'organic') return 'kg';
  return 'units';
}

export function lastDropoffLabel(iso?: string, now = new Date()): string {
  if (!iso) return 'No dropoffs yet';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'No dropoffs yet';
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const then = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const days = Math.round((start - then) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 28) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function calculateUserContributions(
  dropoffs: DropoffActivity[],
  itemsCount: Record<string, number>,
  materialTypes: string[],
  materials: MaterialCatalogItem[],
): MaterialContribution[] {
  const map: Record<string, MaterialContribution> = {};

  for (const [materialType, qty] of Object.entries(itemsCount)) {
    if (qty > 0) {
      map[materialType] = {
        materialType,
        label: materialLabel(materialType),
        totalQuantity: qty,
        totalDropoffs: 0,
        carbonUnits: 0,
      };
    }
  }

  for (const dropoff of dropoffs) {
    const primaryType = (dropoff.materialType ?? 'mixed').toLowerCase();
    if (!map[primaryType]) {
      map[primaryType] = {
        materialType: primaryType,
        label: materialLabel(primaryType),
        totalQuantity: 0,
        totalDropoffs: 0,
        carbonUnits: 0,
      };
    }
    const row = map[primaryType];
    row.totalDropoffs += 1;
    row.totalQuantity += dropoff.quantity;
    const material = materials.find(
      (item) => item.category.toLowerCase() === primaryType && item.isActive,
    );
    if (material && dropoff.quantity > 0) {
      row.carbonUnits += material.cuValue * dropoff.quantity;
    } else if (dropoff.quantity > 0) {
      row.carbonUnits += dropoff.carbonUnits;
    }
    if (!row.lastDropoff || new Date(dropoff.at) > new Date(row.lastDropoff)) {
      row.lastDropoff = dropoff.at;
    }
  }

  for (const materialType of materialTypes) {
    if (!map[materialType]) {
      map[materialType] = {
        materialType,
        label: materialLabel(materialType),
        totalQuantity: 0,
        totalDropoffs: 0,
        carbonUnits: 0,
      };
    }
  }

  return Object.values(map).sort((a, b) => b.carbonUnits - a.carbonUnits);
}

export function impactUnitForCard(materialType: string): string {
  const key = materialType.toLowerCase();
  if (key === 'fabric') return 'Lbs';
  if (key === 'glass') return 'lb';
  return 'units';
}

export type HeatCell = { key: string; count: number; level: 0 | 1 | 2 | 3 };

export function yearHeatCells(
  year: number,
  counts: Record<string, number>,
): HeatCell[] {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const cells: HeatCell[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += 86400000) {
    const key = new Date(time).toISOString().slice(0, 10);
    const count = counts[key] ?? 0;
    const level = count <= 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3;
    cells.push({ key, count, level });
  }
  return cells;
}

export function uniqueActiveDays(
  items: DropoffActivity[],
  year: number,
): number {
  const keys = new Set<string>();
  for (const item of items) {
    const key = activityDayKey(item.at);
    if (key?.startsWith(String(year))) keys.add(key);
  }
  return keys.size;
}

export function dayCounts(items: DropoffActivity[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = activityDayKey(item.at);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function filterContributions(
  rows: MaterialContribution[],
  query: string,
): MaterialContribution[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (row) =>
      row.label.toLowerCase().includes(q) ||
      row.materialType.toLowerCase().includes(q),
  );
}

function num(raw: unknown): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function idOf(raw: Record<string, unknown>): string | null {
  const id = raw.id ?? raw._id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function coordsOf(raw: unknown): { lat: number; lng: number } | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  const gps = row.gpsCoordinates ?? row.gpsCordinates;
  if (gps && typeof gps === 'object') {
    const g = gps as Record<string, unknown>;
    const lat = num(g.latitude ?? g.lat);
    const lng = num(g.longitude ?? g.lng);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      (lat !== 0 || lng !== 0)
    )
      return { lat, lng };
  }
  const loc =
    row.activityLocation ??
    row.dropOffLocation ??
    row.simpleDropOffLocation ??
    row.location;
  if (loc && typeof loc === 'object') {
    const nested =
      (
        loc as {
          location?: { coordinates?: unknown };
          coordinates?: unknown;
          name?: unknown;
        }
      ).location?.coordinates ?? (loc as { coordinates?: unknown }).coordinates;
    if (Array.isArray(nested) && nested.length >= 2) {
      return { lng: num(nested[0]), lat: num(nested[1]) };
    }
  }
  return undefined;
}

export function parseRegularActivity(raw: unknown): DropoffActivity | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = idOf(row);
  if (!id) return null;
  const campaign = Boolean(row.campaign);
  const campaignObj =
    row.campaign && typeof row.campaign === 'object'
      ? (row.campaign as Record<string, unknown>)
      : null;
  const qtyList = Array.isArray(row.dropOffQuantity)
    ? row.dropOffQuantity
    : Array.isArray(row.dropoffQuantity)
      ? row.dropoffQuantity
      : [];
  const fromList = qtyList.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    return sum + num((item as { units?: unknown }).units);
  }, 0);
  const at =
    (typeof row.dropOffDate === 'string' && row.dropOffDate) ||
    (typeof row.createdAt === 'string' && row.createdAt) ||
    '';
  const name =
    (campaignObj && typeof campaignObj.name === 'string' && campaignObj.name) ||
    (typeof row.itemType === 'string' && row.itemType) ||
    'Drop-off';
  const xy = coordsOf(row);
  return {
    id,
    kind: campaign ? 'campaign' : 'regular',
    name,
    materialType: typeof row.itemType === 'string' ? row.itemType : undefined,
    quantity: fromList || num(row.itemQuantity),
    carbonUnits: num(row.carbonUnits ?? row.pointsEarned),
    status: typeof row.status === 'string' ? row.status : undefined,
    campaign,
    at,
    lat: xy?.lat,
    lng: xy?.lng,
  };
}

export function parseSimpleActivity(raw: unknown): DropoffActivity | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = idOf(row);
  if (!id) return null;
  const loc = row.simpleDropOffLocation;
  const name =
    loc &&
    typeof loc === 'object' &&
    typeof (loc as { name?: unknown }).name === 'string'
      ? (loc as { name: string }).name
      : 'Static drop-off';
  const at =
    (typeof row.dropOffDate === 'string' && row.dropOffDate) ||
    (typeof row.createdAt === 'string' && row.createdAt) ||
    '';
  const xy = coordsOf(row) ?? coordsOf(loc);
  return {
    id,
    kind: 'simple',
    name,
    materialType:
      typeof row.materialType === 'string' ? row.materialType : undefined,
    quantity: num(row.quantity),
    carbonUnits: num(row.cuEarned ?? row.carbonUnits ?? row.pointsEarned),
    status: typeof row.status === 'string' ? row.status : undefined,
    campaign: false,
    at,
    lat: xy?.lat,
    lng: xy?.lng,
  };
}

export const ACTION_MAP_CENTER = {
  latitude: 41.3111,
  longitude: -72.9296,
} as const;

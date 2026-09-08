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
  // Local calendar day, not UTC — see the note on toDayKey in core/where.
  // `toISOString()` shifts the day west of Greenwich, which put drop-offs on
  // the wrong square of the Green Commits grid.
  const match = iso.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1] ?? null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

/**
 * Icon name for a material on the Impact breakdown card.
 *
 * Transcribed from `getMaterialIcon` in client/src/utils/materialContributions.ts.
 * Note this is a *different* mapping from the Where-page marker engine: the
 * breakdown card uses FaBox for aluminium (not FaBoxOpen) and has its own
 * biohazard/capsules glyphs, so the two tables are intentionally separate.
 */
export type BreakdownIcon =
  | 'bottle-water'
  | 'shirt'
  | 'wine-glass'
  | 'recycle'
  | 'leaf'
  | 'file-text'
  | 'book'
  | 'cog'
  | 'laptop'
  | 'can'
  | 'biohazard'
  | 'capsules';

const BREAKDOWN_ICONS: Record<string, BreakdownIcon> = {
  plastic: 'bottle-water',
  fabric: 'shirt',
  fabrics: 'shirt',
  glass: 'wine-glass',
  mixed: 'recycle',
  organic: 'leaf',
  organics: 'leaf',
  paper: 'file-text',
  books: 'book',
  metal: 'cog',
  metals: 'cog',
  electronics: 'laptop',
  electronic: 'laptop',
  ewaste: 'laptop',
  'e-waste': 'laptop',
  'e waste': 'laptop',
  aluminium: 'can',
  aluminum: 'can',
  hazardous: 'biohazard',
  drug: 'capsules',
  drugs: 'capsules',
};

export function breakdownIcon(materialType: string): BreakdownIcon {
  const key = (materialType || '').toLowerCase().trim();
  const direct = BREAKDOWN_ICONS[key];
  if (direct) return direct;
  if (
    key.includes('electronic') ||
    key.includes('e-waste') ||
    key.includes('ewaste') ||
    key.includes('laptop') ||
    key.includes('computer')
  ) {
    return 'laptop';
  }
  return 'recycle';
}

export type GridCell = HeatCell & {
  /** Padding days that fall outside the selected period render transparent. */
  inPeriod: boolean;
  /** Local date, for the tap tooltip. */
  date: Date;
};

function localKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toCell(
  date: Date,
  counts: Record<string, number>,
  inPeriod: boolean,
): GridCell {
  const key = localKey(date);
  const count = inPeriod ? (counts[key] ?? 0) : 0;
  const level = count <= 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3;
  return { key, count, level, inPeriod, date };
}

/**
 * Year heat grid as **7 rows** (Sun..Sat), matching ImpactGreenCommitsCard on
 * web: the year is padded backwards to the preceding Sunday and forwards to a
 * whole week, then days are dealt out with `rows[index % 7]` so each column is
 * one week. The previous mobile version flowed the cells with `flexWrap`,
 * which produced a completely different shape.
 */
export function yearHeatRows(
  year: number,
  counts: Record<string, number>,
): GridCell[][] {
  const days: Date[] = [];
  const end = new Date(year, 11, 31);
  for (let d = new Date(year, 0, 1); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  for (let first = days[0]; first && first.getDay() !== 0; first = days[0]) {
    const prev = new Date(first);
    prev.setDate(prev.getDate() - 1);
    days.unshift(prev);
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    if (!last) break;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    days.push(next);
  }

  const rows: GridCell[][] = [[], [], [], [], [], [], []];
  days.forEach((day, index) => {
    rows[index % 7]?.push(toCell(day, counts, day.getFullYear() === year));
  });
  return rows;
}

/**
 * Month grid as weeks of 7, leading/trailing blanks included — the `monthGrid`
 * memo in ImpactGreenCommitsCard.
 */
export function monthHeatWeeks(
  year: number,
  month: number,
  counts: Record<string, number>,
): (GridCell | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: (GridCell | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push(toCell(new Date(year, month, d), counts, true));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (GridCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const ANNUAL_DAYS_GOAL = 365;

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** `goNext` is clamped so the user cannot page past the current period. */
export function canGoNext(
  viewMode: 'month' | 'year',
  year: number,
  month: number,
  now: Date,
): boolean {
  const realYear = now.getFullYear();
  if (viewMode === 'year') return year < realYear;
  let m = month + 1;
  let y = year;
  if (m > 11) {
    m = 0;
    y += 1;
  }
  return !(y > realYear || (y === realYear && m > now.getMonth()));
}

export type ActionMapPoint = {
  key: string;
  lat: number;
  lng: number;
  quantity: number;
  label: string;
};

/** Rejects null island and out-of-range pairs, as web `coordsFromUnknown` does. */
function validCoord(lat?: number, lng?: number): boolean {
  if (lat == null || lng == null) return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Collapses activities onto shared coordinates, summing quantity — the
 * `aggregatePoints` step in ImpactActionMapCard.tsx. Web keys on the
 * coordinate rounded to 4dp, so drop-offs at the same site stack into one
 * larger circle instead of overprinting as identical dots.
 */
export function actionMapPoints(items: DropoffActivity[]): ActionMapPoint[] {
  const map = new Map<string, ActionMapPoint>();
  for (const item of items) {
    if (!validCoord(item.lat, item.lng)) continue;
    const lat = item.lat as number;
    const lng = item.lng as number;
    const key = `${lng.toFixed(4)},${lat.toFixed(4)}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(key, {
        key,
        lat,
        lng,
        quantity: item.quantity,
        label: item.name,
      });
    }
  }
  return Array.from(map.values());
}

/** Web `circleSize`: 12px → 52px on a sqrt scale against the busiest point. */
export function actionMapCircleSize(quantity: number, max: number): number {
  const minPx = 12;
  const maxPx = 52;
  if (max <= 0) return minPx;
  const t = Math.sqrt(quantity / max);
  return Math.round(minPx + t * (maxPx - minPx));
}

/** Web `zoomForSpan`, used after fitting the points' bounding box. */
export function actionMapZoom(lngSpan: number, latSpan: number): number {
  const span = Math.max(lngSpan, latSpan, 0.01);
  if (span > 2) return 8;
  if (span > 0.8) return 9;
  if (span > 0.35) return 10;
  if (span > 0.12) return 11;
  return 11.5;
}

/**
 * Caption under the map: the site name when there is exactly one point,
 * otherwise "Your activity" — matching web's `placeLabel`.
 */
export function actionMapLabel(
  points: ActionMapPoint[],
  loading: boolean,
): string {
  if (points.length > 1) return 'Your activity';
  return points[0]?.label || (loading ? 'Loading…' : 'No drops yet');
}

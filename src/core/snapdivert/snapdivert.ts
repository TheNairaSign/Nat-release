/**
 * SnapDivert (ScanDiverter): what was snapped, its condition, and how DiVA is asked about
 * it. Mirrors web (main 964a78a) api/snapDivertApi.ts, utils/snapDivertChat.ts and
 * pages/snapdivert/SnapDivert.tsx (whereFor, guestItems).
 */

/** What the ML service found on a photo (POST /v1/snaps/identify). */
export type IdentifiedItem = {
  tag: number;
  box: { x_min: number; y_min: number; x_max: number; y_max: number };
  label: string;
  label_confidence: number;
  material: string | null;
};

export type SnapCondition = 'good' | 'repair' | 'broken';
export type SnapStatus = 'pending' | 'diverted' | 'disposed';

/** A kept SnapDivert item (Node /api/snapdivert/items). */
export type SnapItem = {
  _id: string;
  snapId: string;
  imageUrl: string;
  tag: number;
  box: { xMin: number; yMin: number; xMax: number; yMax: number };
  name: string;
  material: string | null;
  condition: SnapCondition | null;
  status: SnapStatus;
  settledAt: string | null;
  createdAt: string;
};

export type SnapStats = { days: number; diverted: number; disposed: number; savedShare: number | null };

export const CONDITIONS: SnapCondition[] = ['good', 'repair', 'broken'];

/** The prototype's words for each condition. */
export const CONDITION_LABELS: Record<SnapCondition, string> = {
  good: 'Good usable',
  repair: 'Need repair',
  broken: "Can't be fixed",
};

/** "good, usable", as History and DiVA's question write it. */
export const CONDITION_WORDS: Record<SnapCondition, string> = {
  good: 'good, usable',
  repair: 'needs repair',
  broken: "can't be fixed",
};

/** The Where tab for what it's made of; things with no tab open the map unfiltered. */
const WHERE_MATERIAL: Record<string, string> = {
  plastic: 'plastic',
  paper: 'paper',
  cardboard: 'paper',
  glass: 'glass',
  metal: 'metal',
  fabric: 'fabrics',
  electronics: 'electronics',
};

export function whereFor(material: string | null): string {
  const tab = material ? WHERE_MATERIAL[material] : undefined;
  return tab ? `/where?materialType=${encodeURIComponent(tab)}` : '/where';
}

/** A guest's items, kept only on screen, in the shape of kept ones. */
export function guestItems(photoUrl: string, found: IdentifiedItem[], now = new Date()): SnapItem[] {
  return found.map((item) => ({
    _id: `guest-${item.tag}`,
    snapId: 'guest',
    imageUrl: photoUrl,
    tag: item.tag,
    box: { xMin: item.box.x_min, yMin: item.box.y_min, xMax: item.box.x_max, yMax: item.box.y_max },
    name: item.label,
    material: item.material,
    condition: null,
    status: 'pending',
    settledAt: null,
    createdAt: now.toISOString(),
  }));
}

/** A kept item's box in the photo component's shape. */
export function toTagged(item: SnapItem) {
  return {
    tag: item.tag,
    box: { x_min: item.box.xMin, y_min: item.box.yMin, x_max: item.box.xMax, y_max: item.box.yMax },
  };
}

type Place = { city?: string; latitude?: number; longitude?: number } | null | undefined;

/**
 * "How to divert?" on one item: the question in the person's words, with the item as
 * context, so the answer is about this thing in this condition.
 */
export function buildSnapDivertChat(item: Pick<SnapItem, 'name' | 'material' | 'condition'>, place?: Place) {
  const condition = item.condition ? CONDITION_WORDS[item.condition] : null;
  return {
    question: `How do I divert my ${item.name.toLowerCase()}?${condition ? ` It's ${condition}.` : ''}`,
    context: {
      divert: {
        item: item.name,
        material: item.material,
        condition: item.condition,
        state: 'active',
        ...(place ? { place } : {}),
      },
    } as Record<string, unknown>,
  };
}

function listed(names: string[]): string {
  const lower = names.map((n) => n.toLowerCase());
  return lower.length < 2 ? lower.join('') : `${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`;
}

/** One question for everything on the photo; one item is just that item. */
export function buildSnapDivertAllChat(
  items: Pick<SnapItem, 'tag' | 'name' | 'material' | 'condition'>[],
  place?: Place,
) {
  if (items.length === 1 && items[0]) return buildSnapDivertChat(items[0], place);
  const each = items
    .map((item) => `${item.tag}. ${item.name}${item.condition ? ` (${CONDITION_WORDS[item.condition]})` : ''}`)
    .join('; ');
  const same = <T,>(values: T[]): T | null => (values.every((v) => v === values[0]) ? (values[0] ?? null) : null);
  return {
    question: `How do I divert these: ${each}?`,
    context: {
      divert: {
        item: listed(items.map((i) => i.name)),
        material: same(items.map((i) => i.material)),
        condition: same(items.map((i) => i.condition)),
        state: 'active',
        ...(place ? { place } : {}),
      },
    } as Record<string, unknown>,
  };
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function parseIdentified(raw: unknown): IdentifiedItem[] {
  const items = raw && typeof raw === 'object' ? (raw as { items?: unknown }).items : null;
  return (Array.isArray(items) ? items : []).flatMap((x) => {
    if (!x || typeof x !== 'object') return [];
    const i = x as Record<string, unknown>;
    if (typeof i.label !== 'string') return [];
    const box = (i.box ?? {}) as Record<string, unknown>;
    return [
      {
        tag: num(i.tag),
        box: { x_min: num(box.x_min), y_min: num(box.y_min), x_max: num(box.x_max), y_max: num(box.y_max) },
        label: i.label,
        label_confidence: num(i.label_confidence),
        material: typeof i.material === 'string' ? i.material : null,
      },
    ];
  });
}

export function parseSnapItem(raw: unknown): SnapItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r._id !== 'string' || typeof r.name !== 'string') return null;
  const box = (r.box ?? {}) as Record<string, unknown>;
  const condition = CONDITIONS.includes(r.condition as SnapCondition) ? (r.condition as SnapCondition) : null;
  const status = (['pending', 'diverted', 'disposed'] as SnapStatus[]).includes(r.status as SnapStatus)
    ? (r.status as SnapStatus)
    : 'pending';
  return {
    _id: r._id,
    snapId: String(r.snapId ?? ''),
    imageUrl: String(r.imageUrl ?? ''),
    tag: num(r.tag),
    box: { xMin: num(box.xMin), yMin: num(box.yMin), xMax: num(box.xMax), yMax: num(box.yMax) },
    name: r.name,
    material: typeof r.material === 'string' ? r.material : null,
    condition,
    status,
    settledAt: typeof r.settledAt === 'string' ? r.settledAt : null,
    createdAt: String(r.createdAt ?? ''),
  };
}

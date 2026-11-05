/**
 * The Grocery Manager's items and what Home and DiVA do with them. Mirrors web (main
 * 964a78a): api/groceryApi.ts types, hooks/useGroceryGlance.ts, utils/groceryUrgency.ts,
 * utils/recycleAction.ts, utils/useUpRequest.ts, utils/divertChat.ts and
 * utils/foodCardChat.ts.
 */

export type GroceryPackaging = {
  /** NatCycle material type; null for mixed materials. */
  primaryType: string | null;
  subType: string | null;
  /** e.g. "plastic tub", "can", "peelings and scraps". */
  label: string;
};

export type GroceryItemStatus = 'active' | 'consumed' | 'discarded' | 'expired';
export type ExpirySource = 'printed' | 'shelf_life' | 'user';

export type GroceryItem = {
  _id: string;
  name: string;
  /** "YYYY-MM-DD…" */
  expiresOn: string;
  expirySource?: ExpirySource;
  status: GroceryItemStatus;
  packaging: GroceryPackaging | null;
  /** A combined row ("3 limes") stands for this many. */
  quantity?: number;
  imageUrl?: string;
  /** The number on the scan's photo, and every number a combined row covers. */
  tag: number;
  tags?: number[];
  cartId?: string;
  /** Per-item switch for the 3-day / 1-day / day-of reminders. */
  remindersEnabled?: boolean;
  settledAt?: string | null;
};

/** One past scan: the photo and everything found in it. */
export type GroceryScan = {
  cartId: string;
  imageUrl?: string;
  scannedAt: string;
  items: GroceryItem[];
};

/** Used against wasted over a period, for History's summary card. */
export type GroceryWasteStats = {
  used: number;
  wasted: number;
  /** 0..1, the share of settled items actually used; null until something settles. */
  savedShare: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long past its date an item stays active (matches the server's morning job). */
export const GRACE_DAYS = 3;
/** "This week": today and the next seven days. */
const WEEK_DAYS = 7;

export function daysUntil(expiresOn: string, today = new Date()): number {
  const target = new Date(`${expiresOn.slice(0, 10)}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / DAY_MS);
}

export function soonestFirst(items: GroceryItem[]): GroceryItem[] {
  return [...items].sort(
    (a, b) => new Date(a.expiresOn).getTime() - new Date(b.expiresOn).getTime(),
  );
}

/** Due in the next seven days, plus anything up to three days past its date. */
export function dueThisWeek(items: GroceryItem[], today = new Date()): GroceryItem[] {
  return items.filter((item) => {
    const days = daysUntil(item.expiresOn, today);
    return days >= -GRACE_DAYS && days <= WEEK_DAYS;
  });
}

/**
 * The food card's chips: what's due this week, or else what's due soonest, one per
 * product name, at most six (web DashboardActionCarousel expiringGroceries).
 */
export function expiringChips(items: GroceryItem[], today = new Date()): GroceryItem[] {
  if (items.length === 0) return [];
  const due = dueThisWeek(items, today);
  const seen = new Set<string>();
  return (due.length > 0 ? due : items)
    .filter((item) => {
      const key = item.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

/** Where the leftovers go: a Where link for the packaging's material. */
export function recycleHref(packaging: GroceryPackaging | null): string {
  if (!packaging?.primaryType) return '/where';
  return `/where?materialType=${encodeURIComponent(packaging.primaryType)}`;
}

const MAX_USE_UP_ITEMS = 8;

/** The items as DiVA's use-up flow wants them: a name, days left, and how many. */
export function toUseUpItems(items: GroceryItem[], today = new Date()) {
  return items.slice(0, MAX_USE_UP_ITEMS).map((item) => ({
    name: item.name,
    // Negative once past its date: food past its date isn't an ingredient.
    daysLeft: daysUntil(item.expiresOn, today),
    ...(item.quantity && item.quantity > 1 ? { quantity: item.quantity } : {}),
  }));
}

export type DivertPlace = {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export function buildDivertContext(item: GroceryItem, place?: DivertPlace) {
  return {
    divert: {
      item: item.name,
      quantity: item.quantity,
      packaging: item.packaging ?? null,
      state:
        item.status === 'consumed'
          ? 'consumed'
          : item.status === 'active'
            ? 'active'
            : 'wasted',
      ...(place && Object.keys(place).length > 0 ? { place } : {}),
    },
  };
}

export const RECIPE_OPTION = 'Make a recipe';
export const DIVERT_OPTION = 'How do I divert the packaging?';

/** "kiwi", "kiwi and banana", "kiwi, jackfruit and banana". */
function nameList(items: GroceryItem[]): string {
  const names = items.map((item) => item.name.trim().toLowerCase());
  if (names.length <= 1) return names[0] ?? 'food';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export type FoodCardOpening = {
  text: string;
  options: string[];
  optionContexts: Record<string, Record<string, unknown>>;
};

/**
 * What DiVA opens with when "Ask Diva" is tapped on the food card: one line about the
 * picked food and two things to do with it. Each option goes back as the question with
 * its own context: the use-up flow answers anything carrying `useUp`, so the divert
 * option must not.
 */
export function buildFoodCardOpening(
  items: GroceryItem[],
  place?: DivertPlace,
  today = new Date(),
): FoodCardOpening {
  const forDivert = items.find((item) => item.packaging?.primaryType) ?? items[0];
  return {
    text: `Here's what I can do with your ${nameList(items)}.`,
    options: [RECIPE_OPTION, DIVERT_OPTION],
    optionContexts: {
      [RECIPE_OPTION]: { useUp: { items: toUseUpItems(items, today) } },
      ...(forDivert ? { [DIVERT_OPTION]: buildDivertContext(forDivert, place) } : {}),
    },
  };
}

/** One row of GET /grocery/items, read defensively. */
export function parseGroceryItem(raw: unknown): GroceryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r._id !== 'string' || typeof r.name !== 'string' || typeof r.expiresOn !== 'string') {
    return null;
  }
  const p = r.packaging && typeof r.packaging === 'object' ? (r.packaging as Record<string, unknown>) : null;
  const status = ['active', 'consumed', 'discarded', 'expired'].includes(String(r.status))
    ? (r.status as GroceryItemStatus)
    : 'active';
  const source = ['printed', 'shelf_life', 'user'].includes(String(r.expirySource))
    ? (r.expirySource as ExpirySource)
    : undefined;
  return {
    _id: r._id,
    name: r.name,
    expiresOn: r.expiresOn,
    status,
    packaging: p
      ? {
          primaryType: typeof p.primaryType === 'string' ? p.primaryType : null,
          subType: typeof p.subType === 'string' ? p.subType : null,
          label: typeof p.label === 'string' ? p.label : 'packaging',
        }
      : null,
    ...(typeof r.quantity === 'number' ? { quantity: r.quantity } : {}),
    ...(typeof r.imageUrl === 'string' ? { imageUrl: r.imageUrl } : {}),
    ...(source ? { expirySource: source } : {}),
    tag: typeof r.tag === 'number' ? r.tag : 0,
    ...(Array.isArray(r.tags) ? { tags: r.tags.filter((t): t is number => typeof t === 'number') } : {}),
    ...(typeof r.cartId === 'string' ? { cartId: r.cartId } : {}),
    ...(typeof r.remindersEnabled === 'boolean' ? { remindersEnabled: r.remindersEnabled } : {}),
    ...(typeof r.settledAt === 'string' || r.settledAt === null
      ? { settledAt: r.settledAt as string | null }
      : {}),
  };
}

export function parseGroceryScan(raw: unknown): GroceryScan | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.cartId !== 'string') return null;
  return {
    cartId: r.cartId,
    ...(typeof r.imageUrl === 'string' ? { imageUrl: r.imageUrl } : {}),
    scannedAt: typeof r.scannedAt === 'string' ? r.scannedAt : new Date().toISOString(),
    items: Array.isArray(r.items)
      ? r.items.flatMap((i) => {
          const item = parseGroceryItem(i);
          return item ? [{ ...item, cartId: item.cartId ?? (r.cartId as string) }] : [];
        })
      : [],
  };
}

export function parseWasteStats(raw: unknown): GroceryWasteStats | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    used: Number(r.used) || 0,
    wasted: Number(r.wasted) || 0,
    savedShare: typeof r.savedShare === 'number' ? r.savedShare : null,
  };
}

/** "Number 10" in a question becomes "number 10 (milk)" (web snapDivertChat withItemNames). */
export function withItemNames(
  question: string,
  items: { tag: number; name: string; tags?: number[] }[],
): string {
  return question.replace(/\b(?:no\.?|number|#)\s*(\d+)\b/gi, (match, n: string) => {
    const tag = Number(n);
    const item = items.find((i) => i.tag === tag || (i.tags ?? []).includes(tag));
    return item ? `number ${n} (${item.name})` : match;
  });
}

/** The divert question for one item, as someone would ask it (web buildDivertQuestion). */
export function buildDivertQuestion(
  item: Pick<GroceryItem, 'name' | 'packaging' | 'status'>,
  place?: DivertPlace,
): string {
  const named = place ? [place.city, place.country].filter(Boolean).join(', ') : '';
  const where = named
    ? ` I'm in ${named}.`
    : place?.latitude !== undefined && place?.longitude !== undefined
      ? " I've shared my location."
      : '';
  const packaging = item.packaging;
  if (item.status === 'discarded' || item.status === 'expired') {
    return `My ${item.name} went off before I could use it. How do I divert it properly, and how do I stop it happening again?${where}`;
  }
  if (!packaging) return `I've got ${item.name} to get rid of. How should I divert it?${where}`;
  if (!packaging.primaryType) {
    return `How do I divert the ${packaging.label} from my ${item.name}? It's mixed materials.${where}`;
  }
  if (packaging.primaryType === 'organic') {
    return `What's the best way to compost the ${packaging.label} from my ${item.name}?${where}`;
  }
  return `How do I divert the ${packaging.label} from my ${item.name}? I think it's ${packaging.primaryType}.${where}`;
}

/** The "Make a recipe" request: this week's food, or else the soonest (web buildUseUpRequest). */
export function buildUseUpRequest(
  items: GroceryItem[] | null,
  today = new Date(),
): { question: string; context: Record<string, unknown> } | null {
  if (!items || items.length === 0) return null;
  const due = dueThisWeek(items, today);
  const pick = (due.length > 0 ? due : items).slice(0, MAX_USE_UP_ITEMS);
  return {
    question: "What can I make with my food that's about to expire?",
    context: { useUp: { items: toUseUpItems(pick, today) } },
  };
}

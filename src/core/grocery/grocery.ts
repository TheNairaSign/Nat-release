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

export type GroceryItem = {
  _id: string;
  name: string;
  /** "YYYY-MM-DD…" */
  expiresOn: string;
  status: 'active' | 'consumed' | 'discarded' | 'expired';
  packaging: GroceryPackaging | null;
  /** A combined row ("3 limes") stands for this many. */
  quantity?: number;
  imageUrl?: string;
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
    ? (r.status as GroceryItem['status'])
    : 'active';
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
  };
}

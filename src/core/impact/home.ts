/**
 * Home diversion: what the Grocery Manager and SnapDivert kept out of landfill (food
 * used, things diverted), counted on Impact beside drop-offs. Mirrors web
 * api/homeDiversionApi.ts and utils/homeDiversion.ts (main 964a78a).
 */
import type { DropoffActivity, MaterialContribution } from './impact';

export type HomeDiversion = {
  food: number;
  things: number;
  /** Packaging from used food, less what's since been handed in at a drop-off. */
  packaging: number;
  total: number;
  cu: number;
  byMaterial: Record<string, { items: number; cu: number }>;
};

export const NO_HOME_DIVERSION: HomeDiversion = {
  food: 0,
  things: 0,
  packaging: 0,
  total: 0,
  cu: 0,
  byMaterial: {},
};

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** The `data` of GET /home-diversion; empty when it can't be read. */
export function parseHomeDiversion(raw: unknown): HomeDiversion {
  if (!raw || typeof raw !== 'object') return NO_HOME_DIVERSION;
  const d = raw as Record<string, unknown>;
  const byMaterial: HomeDiversion['byMaterial'] = {};
  if (d.byMaterial && typeof d.byMaterial === 'object') {
    for (const [type, value] of Object.entries(d.byMaterial as Record<string, unknown>)) {
      const v = (value ?? {}) as Record<string, unknown>;
      byMaterial[type.toLowerCase()] = { items: num(v.items), cu: num(v.cu) };
    }
  }
  return {
    food: num(d.food),
    things: num(d.things),
    packaging: num(d.packaging),
    total: num(d.total),
    cu: num(d.cu),
    byMaterial,
  };
}

/** Everything they've earned: drop-offs plus what they've diverted at home. */
export function totalCarbonUnits(
  user?: { carbonUnits?: number; homeCarbonUnits?: number } | null,
): number {
  return (Number(user?.carbonUnits) || 0) + (Number(user?.homeCarbonUnits) || 0);
}

/**
 * The breakdown with home diversion added to each material's card, or a new card for a
 * material that has none. Cards with something go ahead of empty ones.
 */
export function withHomeDiversion(
  contributions: MaterialContribution[],
  home: HomeDiversion,
): MaterialContribution[] {
  const list = contributions.map((c) => ({ ...c }));
  for (const [type, { items, cu }] of Object.entries(home.byMaterial)) {
    if (items <= 0) continue;
    const existing = list.find((c) => c.materialType.toLowerCase() === type);
    if (existing) {
      existing.totalQuantity += items;
      existing.carbonUnits += cu;
    } else {
      list.push({
        materialType: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        totalQuantity: items,
        totalDropoffs: 0,
        carbonUnits: cu,
        lastDropoff: undefined,
      });
    }
  }
  return list.sort(
    (a, b) =>
      Number(b.totalQuantity > 0) - Number(a.totalQuantity > 0) ||
      b.carbonUnits - a.carbonUnits ||
      b.totalQuantity - a.totalQuantity,
  );
}

/**
 * The top pill: drop-offs at locations (not events), home diversion, and all Carbon
 * Units, floored. Web Impact.tsx `stats`.
 */
export function impactPill(
  activities: DropoffActivity[],
  home: HomeDiversion,
  user?: { carbonUnits?: number; homeCarbonUnits?: number } | null,
): { dropoffs: number; home: number; bcu: number } {
  return {
    dropoffs: activities.filter((a) => a.kind !== 'campaign' && !a.campaign).length,
    home: home.total,
    bcu: Math.floor(totalCarbonUnits(user)),
  };
}

/** The unit under a breakdown card's number (web Impact.tsx contributionUnitLabel). */
export function breakdownUnit(materialType: string): string {
  if (materialType === 'organics' || materialType === 'others') return 'items';
  if (materialType === 'fabric') return 'Lbs';
  if (materialType === 'glass') return 'lb';
  return 'units';
}

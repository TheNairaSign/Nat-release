import { toCanonicalMaterialId } from './match';

export type MaterialChipInput =
  | string
  | {
      name?: string;
      category?: string;
      label?: string;
      createdAt?: string | Date;
      created_at?: string | Date;
    };

export const FALLBACK_DISPOSE_CHIPS = [
  'Food',
  'Plastic bottle',
  'Fabrics',
] as const;

export function capitalizeChip(item: string): string {
  if (!item) return item;
  return item.charAt(0).toUpperCase() + item.slice(1);
}

function isPlasticMaterialCategory(name: string): boolean {
  return toCanonicalMaterialId(name) === 'plastic';
}

function chipName(
  item: MaterialChipInput,
): { name: string; createdAt: string | null } | null {
  if (typeof item === 'string') {
    const name = item.trim();
    return name ? { name, createdAt: null } : null;
  }
  if (!item || typeof item !== 'object') return null;
  const name = String(item.name || item.category || item.label || '').trim();
  if (!name) return null;
  const rawCreated = item.createdAt ?? item.created_at ?? null;
  return { name, createdAt: rawCreated ? String(rawCreated) : null };
}

/** Sort NatCycle chips; case-insensitive dedupe only (no synonym families). */
export function sortMaterialCategories(
  categories: MaterialChipInput[],
): string[] {
  const normalized = categories
    .map(chipName)
    .filter(Boolean) as { name: string; createdAt: string | null }[];

  normalized.sort((a, b) => {
    const aPlastic = isPlasticMaterialCategory(a.name);
    const bPlastic = isPlasticMaterialCategory(b.name);
    if (aPlastic !== bPlastic) return aPlastic ? -1 : 1;

    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number.NaN;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number.NaN;
    const aValid = Number.isFinite(aTime);
    const bValid = Number.isFinite(bTime);
    if (aValid && bValid && aTime !== bTime) return aTime - bTime;
    if (aValid !== bValid) return aValid ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  const byCanon = new Map<string, string>();
  const passthrough: string[] = [];
  for (const item of normalized) {
    const canon = toCanonicalMaterialId(item.name);
    if (!canon) {
      const key = item.name.toLowerCase();
      if (!passthrough.some((p) => p.toLowerCase() === key)) {
        passthrough.push(item.name);
      }
      continue;
    }
    const existing = byCanon.get(canon);
    if (!existing) {
      byCanon.set(canon, item.name);
      continue;
    }
    if (
      item.name.toLowerCase() === canon &&
      existing.toLowerCase() !== canon
    ) {
      byCanon.set(canon, item.name);
    }
  }

  const canonicalLabels = Array.from(byCanon.values());
  const plastic = canonicalLabels.filter((m) => isPlasticMaterialCategory(m));
  const rest = canonicalLabels.filter((m) => !isPlasticMaterialCategory(m));
  return [...plastic, ...rest, ...passthrough];
}

function formatChipLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Homepage dispose chips: merge NatCycle + ThingsMatch without synonym collapse.
 * Exact-name dedupe only, then sort by createdAt ascending.
 */
export function mergeWhereMaterialChips(
  materials: MaterialChipInput[],
  thingsMatch?: MaterialChipInput[],
): string[] {
  const combined = [...(materials || []), ...(thingsMatch || [])]
    .map(chipName)
    .filter(Boolean) as { name: string; createdAt: string | null }[];

  const byKey = new Map<string, { name: string; createdAt: string | null }>();
  for (const item of combined) {
    const key = item.name.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    const existingTime = existing.createdAt
      ? new Date(existing.createdAt).getTime()
      : Number.NaN;
    const newTime = item.createdAt
      ? new Date(item.createdAt).getTime()
      : Number.NaN;
    let createdAt = existing.createdAt;
    if (Number.isFinite(newTime)) {
      if (!Number.isFinite(existingTime) || newTime < existingTime) {
        createdAt = item.createdAt;
      }
    }
    const name =
      item.name.length > existing.name.length ||
      (/[A-Z]/.test(item.name.charAt(0)) &&
        !/[A-Z]/.test(existing.name.charAt(0)))
        ? item.name
        : existing.name;
    byKey.set(key, { name, createdAt });
  }

  const list = Array.from(byKey.values());
  list.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number.NaN;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number.NaN;
    const aValid = Number.isFinite(aTime);
    const bValid = Number.isFinite(bTime);
    if (aValid && bValid && aTime !== bTime) return aTime - bTime;
    if (aValid !== bValid) return aValid ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return list.map((item) => formatChipLabel(item.name));
}

export function disposeChipsOrFallback(chips: string[]): string[] {
  return chips.length > 0 ? chips : [...FALLBACK_DISPOSE_CHIPS];
}

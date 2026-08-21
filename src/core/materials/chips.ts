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

export function sortMaterialCategories(
  categories: MaterialChipInput[],
): string[] {
  const normalized = categories
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim();
        return name ? { name, createdAt: null as string | null } : null;
      }
      if (!item || typeof item !== 'object') return null;
      const name = String(
        item.name || item.category || item.label || '',
      ).trim();
      if (!name) return null;
      const rawCreated = item.createdAt ?? item.created_at ?? null;
      return {
        name,
        createdAt: rawCreated ? String(rawCreated) : null,
      };
    })
    .filter(Boolean) as { name: string; createdAt: string | null }[];

  normalized.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number.NaN;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number.NaN;
    const aValid = Number.isFinite(aTime);
    const bValid = Number.isFinite(bTime);
    if (aValid && bValid && aTime !== bTime) return aTime - bTime;
    if (aValid !== bValid) return aValid ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of normalized) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item.name);
  }
  return out;
}

export function mergeWhereMaterialChips(
  materials: MaterialChipInput[],
  thingsMatch: MaterialChipInput[],
): string[] {
  const primary = sortMaterialCategories(materials);
  const primaryKeys = new Set(primary.map((name) => name.toLowerCase()));
  const tm = sortMaterialCategories(thingsMatch).filter(
    (name) => !primaryKeys.has(name.toLowerCase()),
  );
  return [...primary, ...tm];
}

export function disposeChipsOrFallback(chips: string[]): string[] {
  return chips.length > 0 ? chips : [...FALLBACK_DISPOSE_CHIPS];
}

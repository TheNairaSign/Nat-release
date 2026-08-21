export type MaterialLine = {
  id: string;
  name: string;
  unit: string;
  cuValue: number | null;
};

export type MaterialCatalogEntry = {
  category: string;
  cuValue: number;
};

function titleCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Items';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function isCatchAll(value: string): boolean {
  const key = value.trim().toLowerCase();
  return key === 'all' || key === 'mixed';
}

export function materialLinesForSite(
  materials: string[],
  subtypes: string[],
  catalog: MaterialCatalogEntry[],
): MaterialLine[] {
  const catchAll = materials.some(isCatchAll);
  const fromSite = materials.filter((item) => !isCatchAll(item));
  const names =
    subtypes.length > 0
      ? subtypes
      : catchAll && catalog.length > 0
        ? catalog.map((item) => item.category)
        : fromSite.length > 0
          ? fromSite
          : ['Items'];

  return names.map((name) => {
    const match = catalog.find(
      (item) => item.category.toLowerCase() === name.toLowerCase(),
    );
    return {
      id: name,
      name: titleCase(name),
      unit: 'items',
      cuValue: match?.cuValue ?? null,
    };
  });
}

export function quantitiesAsNumbers(
  raw: Record<string, string>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const qty = Number(value);
    if (Number.isFinite(qty) && qty > 0) out[key] = qty;
  }
  return out;
}

export function estimatedCu(
  lines: MaterialLine[],
  quantities: Record<string, number>,
): number {
  return lines.reduce((sum, line) => {
    const qty = quantities[line.id] ?? 0;
    if (!qty || line.cuValue == null) return sum;
    return sum + line.cuValue * qty;
  }, 0);
}

export function formatCuPerItem(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} CU / item`;
}

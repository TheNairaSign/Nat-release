export type LocationMaterialFields = {
  primaryMaterialType?: string | null;
  secondaryMaterialType?: string | null;
  itemType?: string | null;
  iconMaterialType?: string | null;
  bulkMaterialTypes?: string[] | null;
  materialTypes?: string[] | null;
  materialPackageTags?: ({ material?: string | null } | null)[] | null;
};

export function normalizeRaw(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[_/]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function toCanonicalMaterialId(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const normalized = normalizeRaw(String(raw));
  if (!normalized || normalized === 'all') return null;
  return normalized;
}

export function aliasesForCanonicalId(canonicalId: string): string[] {
  const id = toCanonicalMaterialId(canonicalId);
  return id ? [id] : [];
}

export function expandMaterialTerms(materialType: string): string[] {
  return aliasesForCanonicalId(materialType);
}

export function fieldMatchesMaterial(
  value: string | null | undefined,
  materialType: string,
): boolean {
  if (value == null || !String(value).trim() || !materialType) return false;
  const leftNorm = normalizeRaw(String(value));
  const rightNorm = normalizeRaw(materialType);
  if (!leftNorm || !rightNorm || leftNorm === 'all' || rightNorm === 'all') {
    return false;
  }
  return leftNorm === rightNorm;
}

function pushRaw(target: string[], value: unknown) {
  if (typeof value === 'string' && value.trim()) target.push(value.trim());
}

function collectRawMaterials(
  locationLike: LocationMaterialFields | null | undefined,
): string[] {
  if (!locationLike) return [];
  const raw: string[] = [];
  pushRaw(raw, locationLike.primaryMaterialType);
  pushRaw(raw, locationLike.secondaryMaterialType);
  pushRaw(raw, locationLike.itemType);
  pushRaw(raw, locationLike.iconMaterialType);
  for (const entry of locationLike.bulkMaterialTypes || []) pushRaw(raw, entry);
  for (const entry of locationLike.materialTypes || []) pushRaw(raw, entry);
  for (const tag of locationLike.materialPackageTags || []) {
    if (tag) pushRaw(raw, tag.material);
  }
  return raw;
}

export function acceptedCanonicalIds(
  locationLike: LocationMaterialFields | null | undefined,
): string[] {
  const ids = new Set<string>();
  for (const entry of collectRawMaterials(locationLike)) {
    const id = toCanonicalMaterialId(entry);
    if (id) ids.add(id);
  }
  return Array.from(ids);
}

/** Direct case-insensitive name match only. */
export function locationAcceptsCanonical(
  locationLike: LocationMaterialFields | null | undefined,
  selected: string | null | undefined,
): boolean {
  if (!selected) return true;
  const selectedNorm = normalizeRaw(selected);
  if (!selectedNorm || selectedNorm === 'all') return true;

  for (const entry of collectRawMaterials(locationLike)) {
    if (fieldMatchesMaterial(entry, selected)) return true;
  }
  return false;
}

export function storedPrimaryMaterial(
  locationLike: LocationMaterialFields | null | undefined,
): string | null {
  if (!locationLike) return null;
  const bulk = locationLike.bulkMaterialTypes || [];
  if (bulk[0]?.trim()) return bulk[0].trim();
  if (locationLike.primaryMaterialType?.trim()) {
    return locationLike.primaryMaterialType.trim();
  }
  if (locationLike.itemType?.trim()) return locationLike.itemType.trim();
  const types = locationLike.materialTypes || [];
  if (types[0]?.trim()) return types[0].trim();
  if (locationLike.iconMaterialType?.trim()) {
    return locationLike.iconMaterialType.trim();
  }
  return null;
}

export function storedSecondaryMaterial(
  locationLike: LocationMaterialFields | null | undefined,
): string | null {
  if (!locationLike) return null;
  const bulk = locationLike.bulkMaterialTypes || [];
  if (bulk[1]?.trim() && bulk[1].trim() !== bulk[0]?.trim()) {
    return bulk[1].trim();
  }
  if (locationLike.secondaryMaterialType?.trim()) {
    return locationLike.secondaryMaterialType.trim();
  }
  return null;
}

export function displayMaterials(
  locationLike: LocationMaterialFields | null | undefined,
  selected: string | null | undefined,
): { icon: string; secondary?: string } {
  if (selected && locationAcceptsCanonical(locationLike, selected)) {
    return { icon: selected };
  }
  const primary = storedPrimaryMaterial(locationLike) || 'others';
  const secondary = storedSecondaryMaterial(locationLike) || undefined;
  return {
    icon: primary,
    secondary:
      secondary && normalizeRaw(secondary) !== normalizeRaw(primary)
        ? secondary
        : undefined,
  };
}

export function isMaterialTypeMatch(
  searchMaterial: string,
  primaryMaterial?: string | null,
  secondaryMaterial?: string | null,
  bulkMaterials?: string[],
  _acceptedSubtypes?: string[],
): boolean {
  if (!searchMaterial) return false;
  return locationAcceptsCanonical(
    {
      primaryMaterialType: primaryMaterial,
      secondaryMaterialType: secondaryMaterial,
      bulkMaterialTypes: bulkMaterials,
    },
    searchMaterial,
  );
}

export function resolveMaterialToCatalogOption(
  input: string,
  catalog: string[],
): string | null {
  const needle = String(input || '').trim();
  if (!needle) return null;
  for (const option of catalog) {
    if (normalizeRaw(option) === normalizeRaw(needle)) return option;
  }
  return null;
}

export function findMatchingMaterial(
  searchTerm: string,
  availableMaterials: string[],
): string | null {
  if (!searchTerm || availableMaterials.length === 0) return null;
  return resolveMaterialToCatalogOption(searchTerm, availableMaterials);
}

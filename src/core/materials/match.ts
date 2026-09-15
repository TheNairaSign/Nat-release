/**
 * Canonical materials system (Where 1A + 2A).
 * Keep in sync with client/src/utils/materialMatch.ts.
 */

export type LocationMaterialFields = {
  primaryMaterialType?: string | null;
  secondaryMaterialType?: string | null;
  itemType?: string | null;
  iconMaterialType?: string | null;
  bulkMaterialTypes?: string[] | null;
  materialTypes?: string[] | null;
  materialPackageTags?: ({ material?: string | null } | null)[] | null;
};

const CANONICAL_ALIASES: Record<string, string[]> = {
  plastic: [
    'plastic',
    'plastics',
    'pet',
    'pet bottles',
    'hdpe',
    'pvc',
    'ldpe',
    'pp',
    'ps',
    'styrofoam',
    'polystyrene',
  ],
  fabric: [
    'fabric',
    'fabrics',
    'cloth',
    'clothes',
    'clothing',
    'textile',
    'textiles',
    'shoe',
    'shoes',
  ],
  glass: ['glass', 'sodalime', 'soda lime'],
  metal: ['metal', 'metals', 'aluminium', 'aluminum', 'scrap', 'cans'],
  paper: ['paper', 'cardboard', 'newspaper', 'book', 'books'],
  organic: ['organic', 'organics', 'food', 'garden'],
  ewaste: [
    'ewaste',
    'e-waste',
    'e waste',
    'electronics',
    'electronic',
    'battery',
    'batteries',
  ],
  tire: ['tire', 'tires', 'tyre', 'tyres'],
  hazardous: [
    'hazardous',
    'hazard',
    'biohazard',
    'toxic',
    'chemical',
    'chemicals',
  ],
  drug: [
    'drug',
    'drugs',
    'medication',
    'medicine',
    'pharmaceutical',
    'pharma',
    'prescription',
    'pill',
    'pills',
    'capsule',
    'capsules',
  ],
};

const ALIAS_TO_CANONICAL: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(CANONICAL_ALIASES)) {
    map.set(canonical, canonical);
    for (const alias of aliases) map.set(alias, canonical);
  }
  map.set('fabrics', 'fabric');
  map.set('organics', 'organic');
  map.set('food', 'organic');
  map.set('electronics', 'ewaste');
  map.set('aluminium', 'metal');
  map.set('aluminum', 'metal');
  map.set('tires', 'tire');
  map.set('tyre', 'tire');
  map.set('tyres', 'tire');
  map.set('drugs', 'drug');
  return map;
})();

function normalizeRaw(value: string): string {
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
  return ALIAS_TO_CANONICAL.get(normalized) ?? null;
}

export function aliasesForCanonicalId(canonicalId: string): string[] {
  const id = toCanonicalMaterialId(canonicalId) || normalizeRaw(canonicalId);
  if (!id) return [];
  const aliases = CANONICAL_ALIASES[id] || [id];
  return Array.from(new Set([id, ...aliases]));
}

export function expandMaterialTerms(materialType: string): string[] {
  const canon = toCanonicalMaterialId(materialType);
  if (!canon) {
    const raw = normalizeRaw(materialType);
    return raw ? [raw] : [];
  }
  return aliasesForCanonicalId(canon);
}

export function fieldMatchesMaterial(
  value: string | null | undefined,
  materialType: string,
): boolean {
  const left = toCanonicalMaterialId(value);
  const right = toCanonicalMaterialId(materialType);
  if (!left || !right) return false;
  return left === right;
}

function pushRaw(target: string[], value: unknown) {
  if (typeof value === 'string' && value.trim()) target.push(value.trim());
}

export function acceptedCanonicalIds(
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
  const ids = new Set<string>();
  for (const entry of raw) {
    const id = toCanonicalMaterialId(entry);
    if (id) ids.add(id);
  }
  return Array.from(ids);
}

export function locationAcceptsCanonical(
  locationLike: LocationMaterialFields | null | undefined,
  selected: string | null | undefined,
): boolean {
  if (!selected) return true;
  const needle = toCanonicalMaterialId(selected);
  if (!needle) return false;
  return acceptedCanonicalIds(locationLike).includes(needle);
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
  const selectedCanon = selected ? toCanonicalMaterialId(selected) : null;
  if (
    selected &&
    selectedCanon &&
    locationAcceptsCanonical(locationLike, selected)
  ) {
    return { icon: selected };
  }
  const primary = storedPrimaryMaterial(locationLike) || 'others';
  const secondary = storedSecondaryMaterial(locationLike) || undefined;
  return {
    icon: primary,
    secondary:
      secondary &&
      toCanonicalMaterialId(secondary) !== toCanonicalMaterialId(primary)
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

export function findMatchingMaterial(
  searchTerm: string,
  availableMaterials: string[],
): string | null {
  if (!searchTerm || availableMaterials.length === 0) return null;
  const needle = searchTerm.trim();
  for (const option of availableMaterials) {
    if (option.toLowerCase() === needle.toLowerCase()) return option;
  }
  const needleCanon = toCanonicalMaterialId(needle);
  if (needleCanon) {
    for (const option of availableMaterials) {
      if (toCanonicalMaterialId(option) === needleCanon) return option;
    }
  }
  return null;
}

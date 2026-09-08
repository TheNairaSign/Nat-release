function escapeRegex(value: string): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TYRE_ALIASES = ['tire', 'tires', 'tyre', 'tyres', 'wheel', 'wheels'];
const DRUG_ALIASES = [
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
];

const MATERIAL_ALIASES: Record<string, string[]> = {
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
  fabrics: [
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
  metal: ['metal', 'aluminium', 'aluminum', 'can', 'cans', 'scrap'],
  aluminium: ['aluminium', 'aluminum', 'can', 'cans', 'metal'],
  aluminum: ['aluminium', 'aluminum', 'can', 'cans', 'metal'],
  paper: ['paper', 'cardboard', 'newspaper', 'book', 'books'],
  organic: ['organic', 'organics', 'food', 'garden'],
  organics: ['organic', 'organics', 'food', 'garden'],
  food: ['food', 'organic', 'organics'],
  ewaste: [
    'ewaste',
    'e-waste',
    'electronics',
    'electronic',
    'battery',
    'batteries',
  ],
  electronics: [
    'ewaste',
    'e-waste',
    'electronics',
    'electronic',
    'battery',
    'batteries',
  ],
  // Added on web in "Align campaign material checkboxes with stored alias
  // labels" (d89313a). Without these a "Tires" / "Drugs" / "Hazardous" filter
  // chip matched nothing on mobile, because stored values use the variants.
  tire: TYRE_ALIASES,
  tires: TYRE_ALIASES,
  tyre: TYRE_ALIASES,
  tyres: TYRE_ALIASES,
  hazardous: [
    'hazardous',
    'hazard',
    'biohazard',
    'toxic',
    'chemical',
    'chemicals',
  ],
  drug: DRUG_ALIASES,
  drugs: DRUG_ALIASES,
};

export function expandMaterialTerms(materialType: string): string[] {
  if (!materialType) return [];
  const raw = String(materialType).toLowerCase().trim();
  if (!raw) return [];
  const terms = new Set<string>([raw]);
  for (const [key, aliases] of Object.entries(MATERIAL_ALIASES)) {
    const inFamily =
      raw === key ||
      aliases.some(
        (alias) => raw === alias || raw.includes(alias) || alias.includes(raw),
      );
    if (inFamily) {
      terms.add(key);
      aliases.forEach((alias) => terms.add(alias));
    }
  }
  return Array.from(terms);
}

export function fieldMatchesMaterial(
  value: string | null | undefined,
  materialType: string,
): boolean {
  if (!value || !materialType) return false;
  const hay = String(value).toLowerCase().trim();
  return expandMaterialTerms(materialType).some((term) => {
    if (term.length <= 3) {
      const re = new RegExp(
        `(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`,
        'i',
      );
      return re.test(hay);
    }
    return hay.includes(term) || term.includes(hay);
  });
}

export function isMaterialTypeMatch(
  searchMaterial: string,
  primaryMaterial?: string | null,
  secondaryMaterial?: string | null,
  bulkMaterials?: string[],
  acceptedSubtypes?: string[],
): boolean {
  if (!searchMaterial) return false;
  if (fieldMatchesMaterial(primaryMaterial, searchMaterial)) return true;
  if (fieldMatchesMaterial(secondaryMaterial, searchMaterial)) return true;
  if (bulkMaterials?.some((mat) => fieldMatchesMaterial(mat, searchMaterial)))
    return true;
  if (
    acceptedSubtypes?.some((sub) => fieldMatchesMaterial(sub, searchMaterial))
  ) {
    return true;
  }
  return false;
}

export function findMatchingMaterial(
  searchTerm: string,
  availableMaterials: string[],
): string | null {
  if (!searchTerm || availableMaterials.length === 0) return null;
  const normalizedSearch = searchTerm.toLowerCase().trim();
  const exactMatch = availableMaterials.find(
    (type) => type.toLowerCase() === normalizedSearch,
  );
  if (exactMatch) return exactMatch;
  const substringMatch = availableMaterials.find((type) =>
    type.toLowerCase().includes(normalizedSearch),
  );
  if (substringMatch) return substringMatch;
  const reverseMatch = availableMaterials.find((type) =>
    normalizedSearch.includes(type.toLowerCase()),
  );
  if (reverseMatch) return reverseMatch;
  const otherType = availableMaterials.find((type) =>
    type.toLowerCase().includes('others'),
  );
  return otherType ?? availableMaterials[0] ?? null;
}

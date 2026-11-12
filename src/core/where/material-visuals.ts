/**
 * Per-material marker colour and icon, as web's materialVisualRegistry + materialVisualDefaults
 * (client/src/utils). URS supplies each primary material's own `iconUrl` and `colorHex`
 * through GET /materials/primary-types (`categories`); anything URS doesn't give falls back
 * to these defaults, then to the marker engine's own profile.
 */

export type MaterialVisual = {
  iconUrl?: string | null;
  colorHex?: string | null;
};

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function normalizeColorHex(value?: string | null): string | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (!HEX_RE.test(withHash)) return null;
  if (withHash.length === 4) {
    const r = withHash[1];
    const g = withHash[2];
    const b = withHash[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return withHash.toUpperCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeColorHex(hex);
  if (!normalized) return null;
  const full = normalized.slice(1);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** 0 (black) to 1 (white); above 0.62 a white glyph would be hard to see. */
export function hexLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

export const MATERIAL_VISUAL_DEFAULTS: Record<string, MaterialVisual> = {
  plastic: { colorHex: '#3B82F6' },
  'paper-and-cardboards': { colorHex: '#F59E0B' },
  paper: { colorHex: '#F59E0B' },
  cardboard: { colorHex: '#F59E0B' },
  fabrics: { colorHex: '#8B5CF6' },
  fabric: { colorHex: '#8B5CF6' },
  glass: { colorHex: '#14B8A6' },
  aluminium: { colorHex: '#94A3B8' },
  aluminum: { colorHex: '#94A3B8' },
  organics: { colorHex: '#65A30D' },
  organic: { colorHex: '#65A30D' },
  books: { colorHex: '#F59E0B' },
  clothes: { colorHex: '#8B5CF6' },
  electronics: { colorHex: '#EF4444' },
  ewaste: { colorHex: '#EF4444' },
  'e-waste': { colorHex: '#EF4444' },
  phone: { colorHex: '#EF4444' },
  metal: { colorHex: '#64748B' },
  food: { colorHex: '#65A30D' },
  furnitures: { colorHex: '#B45309' },
  furniture: { colorHex: '#B45309' },
  shoes: { colorHex: '#8B5CF6' },
  tire: { colorHex: '#92400E' },
  tires: { colorHex: '#92400E' },
  paint: { colorHex: '#6366F1' },
  drug: { colorHex: '#FF9A9A' },
  drugs: { colorHex: '#FF9A9A' },
  hazardous: { colorHex: '#F5D74D' },
  hazard: { colorHex: '#F5D74D' },
  others: { colorHex: '#16A34A' },
  other: { colorHex: '#16A34A' },
};

const ursVisuals = new Map<string, MaterialVisual>();

const keyOf = (value: string) => String(value || '').toLowerCase().trim();

/** Remembers URS's icon and colour per material, from the chips response. */
export function registerMaterialVisuals(
  entries: {
    category?: string | null;
    name?: string | null;
    iconUrl?: string | null;
    colorHex?: string | null;
  }[],
): void {
  for (const entry of entries) {
    const category = keyOf(entry.category || entry.name || '');
    if (!category) continue;
    const iconUrl = entry.iconUrl == null ? null : String(entry.iconUrl).trim() || null;
    const colorHex = normalizeColorHex(entry.colorHex);
    const prev = ursVisuals.get(category) ?? {};
    ursVisuals.set(category, {
      iconUrl: iconUrl ?? prev.iconUrl ?? null,
      colorHex: colorHex ?? prev.colorHex ?? null,
    });
  }
}

export function clearMaterialVisuals(): void {
  ursVisuals.clear();
}

export function resolveMaterialVisual(materialType?: string | null): MaterialVisual | null {
  const key = keyOf(materialType || '');
  if (!key) return null;
  const fromUrs = ursVisuals.get(key);
  const fromDefaults =
    MATERIAL_VISUAL_DEFAULTS[key] ??
    Object.entries(MATERIAL_VISUAL_DEFAULTS).find(
      ([defaultKey]) => key.includes(defaultKey) || defaultKey.includes(key),
    )?.[1] ??
    null;
  if (!fromUrs && !fromDefaults) return null;
  return {
    iconUrl: fromUrs?.iconUrl ?? null,
    colorHex: fromUrs?.colorHex ?? fromDefaults?.colorHex ?? null,
  };
}

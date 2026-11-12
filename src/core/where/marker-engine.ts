/**
 * Port of the web `IconEngine` (client/src/services/IconEngine.tsx @ main).
 *
 * Web renders a coloured marker with a material glyph inside it. The previous
 * mobile implementation kept only the colour, so every marker drew as an empty
 * shape — this module restores the full spec: glyph, shape, ring, glow, the
 * secondary-material badge, and the event/inactive variants.
 *
 * Pure logic only (no React, no Expo) per AGENTS.md layering. The UI layer maps
 * `glyph` onto a component from shared/ui/icons.
 */

import {
  hexLuminance,
  hexToRgb,
  normalizeColorHex,
  resolveMaterialVisual,
} from './material-visuals';

/** Matches the web `MarkerShape` union, including pill and hexagon. */
export type MarkerShape =
  'squircle' | 'circle' | 'hexagon' | 'pill' | 'calendar';

export type MarkerVariant = 'live' | 'upcoming' | 'ended';

/** Names map 1:1 onto exports of shared/ui/icons/materialGlyphs (+ the four
 *  raster glyphs which have no FontAwesome equivalent). */
export type GlyphName =
  | 'BottleWater'
  | 'File'
  | 'GlassWater'
  | 'Gear'
  | 'Leaf'
  | 'Book'
  | 'Shirt'
  | 'Laptop'
  | 'Burger'
  | 'Couch'
  | 'ShoePrints'
  | 'Recycle'
  | 'CalendarDays'
  | 'MobileScreen'
  | 'BoxOpen'
  | 'Star'
  | 'Tire'
  | 'Paint'
  | 'Biohazard'
  | 'Drug';

export type MarkerColor = {
  /** Fill of the marker body. */
  bg: string;
  /** Highlight ring colour (web `ring-*`). */
  ring: string;
  /** `r,g,b` triple used for the coloured drop-glow. */
  glowRgb: string;
};

export type MaterialProfile = {
  key: string;
  glyph: GlyphName;
  keywords: string[];
  color: MarkerColor;
  /** dark = near-black glyph (hazard on yellow); default is white. */
  glyphTone?: 'light' | 'dark';
};

// Tailwind hexes, cross-checked against each entry's glowRgb in the web file.
const MATERIALS: MaterialProfile[] = [
  {
    key: 'plastic',
    glyph: 'BottleWater',
    keywords: ['plastic', 'pet', 'hdpe', 'ldpe', 'poly', 'bottle'],
    color: { bg: '#3b82f6', ring: '#93c5fd', glowRgb: '59,130,246' },
  },
  {
    key: 'paper-and-cardboards',
    glyph: 'File',
    keywords: [
      'paper',
      'cardboard',
      'cardboards',
      'paper and cardboards',
      'carton',
    ],
    color: { bg: '#f59e0b', ring: '#fcd34d', glowRgb: '245,158,11' },
  },
  {
    key: 'fabrics',
    glyph: 'Shirt',
    keywords: ['fabric', 'fabrics', 'textile', 'cloth'],
    color: { bg: '#8b5cf6', ring: '#c4b5fd', glowRgb: '139,92,246' },
  },
  {
    key: 'glass',
    glyph: 'GlassWater',
    keywords: ['glass'],
    color: { bg: '#14b8a6', ring: '#5eead4', glowRgb: '20,184,166' },
  },
  {
    key: 'aluminium',
    glyph: 'BoxOpen',
    keywords: ['aluminium', 'aluminum', 'alum', 'can', 'tin'],
    color: { bg: '#94a3b8', ring: '#cbd5e1', glowRgb: '148,163,184' },
  },
  {
    key: 'organics',
    glyph: 'Leaf',
    keywords: ['organic', 'organics', 'biomass', 'compost'],
    color: { bg: '#65a30d', ring: '#bef264', glowRgb: '101,163,13' },
  },
  {
    key: 'books',
    glyph: 'Book',
    keywords: ['book', 'books', 'magazine'],
    color: { bg: '#f59e0b', ring: '#fcd34d', glowRgb: '245,158,11' },
  },
  {
    key: 'clothes',
    glyph: 'Shirt',
    keywords: ['clothes', 'clothing', 'shirt', 'apparel', 'garment', 'pants'],
    color: { bg: '#8b5cf6', ring: '#c4b5fd', glowRgb: '139,92,246' },
  },
  // Electronics is listed before metal so e-waste never picks up the gear.
  {
    key: 'electronics',
    glyph: 'Laptop',
    keywords: [
      'electronic',
      'electronics',
      'e-waste',
      'ewaste',
      'e waste',
      'device',
      'computer',
      'laptop',
      'monitor',
      'appliance',
    ],
    color: { bg: '#ef4444', ring: '#fca5a5', glowRgb: '239,68,68' },
  },
  {
    key: 'phone',
    glyph: 'MobileScreen',
    keywords: ['phone', 'mobile phone', 'smartphone', 'handset'],
    color: { bg: '#ef4444', ring: '#fca5a5', glowRgb: '239,68,68' },
  },
  {
    key: 'metal',
    glyph: 'Gear',
    keywords: ['metal', 'metals', 'steel', 'iron', 'copper'],
    color: { bg: '#64748b', ring: '#cbd5e1', glowRgb: '100,116,139' },
  },
  {
    key: 'food',
    glyph: 'Burger',
    keywords: ['food', 'food waste', 'grocery', 'meal'],
    color: { bg: '#65a30d', ring: '#bef264', glowRgb: '101,163,13' },
  },
  {
    key: 'furnitures',
    glyph: 'Couch',
    keywords: ['furniture', 'furnitures', 'sofa', 'couch', 'chair', 'table'],
    color: { bg: '#b45309', ring: '#fbbf24', glowRgb: '180,83,9' },
  },
  {
    key: 'shoes',
    glyph: 'ShoePrints',
    keywords: ['shoe', 'shoes', 'footwear', 'sneaker', 'boot'],
    color: { bg: '#8b5cf6', ring: '#c4b5fd', glowRgb: '139,92,246' },
  },
  {
    key: 'tire',
    glyph: 'Tire',
    keywords: ['tire', 'tires', 'tyre', 'tyres', 'wheel'],
    color: { bg: '#92400e', ring: '#f59e0b', glowRgb: '146,64,14' },
  },
  {
    key: 'paint',
    glyph: 'Paint',
    keywords: ['paint', 'paints', 'paint can', 'latex paint', 'oil paint'],
    color: { bg: '#6366f1', ring: '#a5b4fc', glowRgb: '99,102,241' },
  },
  {
    key: 'drug',
    glyph: 'Drug',
    keywords: [
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
    color: { bg: '#FF9A9A', ring: '#FFB6B6', glowRgb: '255,154,154' },
  },
  {
    key: 'hazardous',
    glyph: 'Biohazard',
    keywords: [
      'hazardous',
      'hazard',
      'biohazard',
      'toxic',
      'chemical',
      'chemicals',
      'dangerous goods',
    ],
    // Shares the brand yellow with upcoming event pins.
    color: { bg: '#F5D74D', ring: '#E8C040', glowRgb: '245,215,77' },
    glyphTone: 'dark',
  },
  {
    key: 'campaign',
    glyph: 'CalendarDays',
    keywords: ['campaign', 'event', 'drive'],
    color: { bg: '#e11d48', ring: '#fb7185', glowRgb: '225,29,72' },
  },
  {
    key: 'others',
    glyph: 'Recycle',
    keywords: ['other', 'others', 'all', 'mixed', 'general'],
    color: { bg: '#16a34a', ring: '#86efac', glowRgb: '22,163,74' },
  },
];

/** Shape signals facility type; material colour signals what's accepted. */
const PLATFORM_SHAPES: Record<string, MarkerShape> = {
  p1: 'squircle',
  p2: 'squircle',
  static: 'squircle',
  centers: 'squircle',
  p3: 'calendar',
  campaign: 'calendar',
  p4: 'pill',
  mobile: 'pill',
  p5a: 'circle',
  p5b: 'circle',
  simple: 'circle',
  education: 'squircle',
};

const LIVE_EVENT_COLOR: MarkerColor = {
  bg: '#059669',
  ring: '#34d399',
  glowRgb: '5,150,105',
};
const UPCOMING_EVENT_COLOR: MarkerColor = {
  bg: '#F5D74D',
  ring: '#E8C040',
  glowRgb: '245,215,77',
};
const ENDED_EVENT_COLOR: MarkerColor = {
  bg: '#9ca3af',
  ring: '#d1d5db',
  glowRgb: '156,163,175',
};
const INACTIVE_COLOR: MarkerColor = {
  bg: '#94a3b8',
  ring: '#cbd5e1',
  glowRgb: '148,163,184',
};

/** Events and mobile units carry identity colours that beat the material. */
const PLATFORM_COLOR_OVERRIDES: Record<string, MarkerColor> = {
  p3: LIVE_EVENT_COLOR,
  campaign: LIVE_EVENT_COLOR,
  // Web sets bg-amber-600 with an amber-700 glow; kept as-is to match exactly.
  p4: { bg: '#d97706', ring: '#fbbf24', glowRgb: '180,83,9' },
  mobile: { bg: '#d97706', ring: '#fbbf24', glowRgb: '180,83,9' },
  education: { bg: '#E8B923', ring: '#F5D74D', glowRgb: '245,215,77' },
};

const DEFAULT_COLOR: MarkerColor = {
  bg: '#16a34a',
  ring: '#86efac',
  glowRgb: '22,163,74',
};
const DEFAULT_SHAPE: MarkerShape = 'squircle';

const OTHERS = MATERIALS.find((m) => m.key === 'others')!;
const ELECTRONICS = MATERIALS.find((m) => m.key === 'electronics')!;

/** Mirrors the web `findProfile`, including the electronics-wins rule. */
export function findMaterialProfile(typeStr: string): MaterialProfile {
  const norm = (typeStr || '').toLowerCase().trim();
  if (!norm) return OTHERS;

  // Electronics always wins — never fall through to the metal gear.
  if (
    /electronic|e[\s-]?waste|ewaste|laptop|computer|monitor|appliance/.test(
      norm,
    )
  ) {
    return ELECTRONICS;
  }

  const exact = MATERIALS.find((m) => m.key === norm);
  if (exact) return exact;

  for (const m of MATERIALS) {
    if (m.keywords.some((k) => norm.includes(k) || k.includes(norm))) return m;
  }
  return OTHERS;
}

export type MarkerSpec = {
  shape: MarkerShape;
  color: MarkerColor;
  glyph: GlyphName;
  /** URS's own icon for the material (black artwork, tinted to `glyphColor`). */
  iconUrl: string | null;
  /** Colour to paint the glyph itself. */
  glyphColor: string;
  glyphSize: number;
  width: number;
  height: number;
  opacity: number;
  showRing: boolean;
  /** Secondary material shown as a small badge, bottom-right. */
  secondary: {
    glyph: GlyphName;
    glyphColor: string;
    bg: string;
    size: number;
  } | null;
};

const WHITE = '#ffffff';
const DARK = '#1A1A1A';

function colorFromHex(hex: string): MarkerColor | null {
  const normalized = normalizeColorHex(hex);
  const rgb = normalized ? hexToRgb(normalized) : null;
  if (!normalized || !rgb) return null;
  return { bg: normalized, ring: 'rgba(0,0,0,0.1)', glowRgb: `${rgb.r},${rgb.g},${rgb.b}` };
}

/**
 * Full render spec for one marker — the mobile equivalent of
 * `IconEngine.getIcon`. Education pins keep their own star treatment on web;
 * they are resolved here through the normal path plus the education colour
 * override, which is the only place mobile intentionally simplifies.
 */
export function resolveMarker(input: {
  platformClass?: string;
  materialType: string;
  iconMaterialType?: string;
  secondaryMaterialType?: string;
  size: number;
  isHighlighted?: boolean;
  markerVariant?: MarkerVariant;
  isInactive?: boolean;
}): MarkerSpec {
  const {
    platformClass,
    materialType,
    iconMaterialType,
    secondaryMaterialType,
    size,
    isHighlighted = false,
    markerVariant = 'live',
    isInactive = false,
  } = input;

  const primary = findMaterialProfile(iconMaterialType || materialType);
  const rawSecondary = secondaryMaterialType
    ? findMaterialProfile(secondaryMaterialType)
    : null;
  const secondary =
    rawSecondary && rawSecondary.key !== primary.key ? rawSecondary : null;

  const platformKey = String(platformClass || '')
    .toLowerCase()
    .trim();
  const shape = PLATFORM_SHAPES[platformKey] ?? DEFAULT_SHAPE;

  // Web IconEngine: URS's own colour/icon for the material, then the defaults, then the
  // profile. Platform identity colours (events, mobile units) still win.
  const visual = resolveMaterialVisual(iconMaterialType || materialType);
  const visualColor = visual?.colorHex ? colorFromHex(visual.colorHex) : null;
  const glyphDark = visual?.colorHex
    ? hexLuminance(visual.colorHex) > 0.62
    : primary.glyphTone === 'dark';

  let color =
    PLATFORM_COLOR_OVERRIDES[platformKey] ?? visualColor ?? primary.color ?? DEFAULT_COLOR;

  const isEventPin = platformKey === 'campaign' || platformKey === 'p3';
  if (isEventPin && markerVariant === 'upcoming') color = UPCOMING_EVENT_COLOR;
  else if (isEventPin && markerVariant === 'ended') color = ENDED_EVENT_COLOR;

  if (isInactive) color = INACTIVE_COLOR;

  const isEnded = markerVariant === 'ended' || isInactive;
  const isWide = shape === 'pill';
  const isCalendar = shape === 'calendar';

  const badgePx = Math.round(size * 0.475);

  // A platform colour override (events) carries its own tone; only material colours
  // decide the glyph by luminance.
  const overridden = Boolean(PLATFORM_COLOR_OVERRIDES[platformKey]) || isInactive;
  const darkGlyph = overridden ? primary.glyphTone === 'dark' : glyphDark;

  return {
    shape,
    color,
    glyph: primary.glyph,
    // Events keep their calendar; a URS icon only replaces a material's glyph.
    iconUrl: isEventPin ? null : (visual?.iconUrl ?? null),
    glyphColor: darkGlyph ? DARK : WHITE,
    glyphSize: Math.round(size * 0.58),
    width: isWide
      ? Math.round(size * 1.55)
      : isCalendar
        ? Math.round(size * 0.92)
        : size,
    height: isCalendar ? Math.round(size * 1.08) : size,
    opacity: isEnded ? 0.55 : 1,
    showRing: isHighlighted && !isEnded,
    secondary: secondary
      ? {
          glyph: secondary.glyph,
          glyphColor: secondary.glyphTone === 'dark' ? DARK : WHITE,
          bg: secondary.color.bg,
          size: badgePx,
        }
      : null,
  };
}

/** Corner radius per shape — web uses rounded-[28%] / [18%] / full. */
export function markerRadius(
  shape: MarkerShape,
  width: number,
  height: number,
): number {
  switch (shape) {
    case 'circle':
    case 'pill':
      return Math.min(width, height) / 2;
    case 'squircle':
      return Math.round(Math.min(width, height) * 0.28);
    case 'calendar':
      return Math.round(Math.min(width, height) * 0.18);
    case 'hexagon':
      return 0;
  }
}

/**
 * Builds a marker spec for a place, reproducing how WhereMapbox.tsx feeds
 * `<UnifiedMarker>` in each of its three branches:
 *
 *   regular   materialType = marker.materialType, platformClass ?? "P1"
 *   simple    materialType = display primary, iconMaterialType override,
 *             isInactive = isActive === false, platformClass ?? "P5A"
 *   campaign  materialType = "campaign" (calendar glyph) with the first
 *             campaign material as the *secondary* badge, platformClass
 *             "campaign", markerVariant from the campaign phase
 */
export function markerSpecForPlace(
  place: {
    kind: 'regular' | 'simple' | 'campaign';
    materials: string[];
    platformClass?: string;
    isActive?: boolean;
    phase?: MarkerVariant;
  },
  options: { size: number; isHighlighted?: boolean },
): MarkerSpec {
  const [primary, secondary] = place.materials;

  if (place.kind === 'campaign') {
    return resolveMarker({
      platformClass: 'campaign',
      materialType: 'campaign',
      secondaryMaterialType: place.materials.find(Boolean),
      markerVariant: place.phase ?? 'live',
      size: options.size,
      isHighlighted: options.isHighlighted,
    });
  }

  const fallbackClass = place.kind === 'simple' ? 'P5A' : 'P1';

  return resolveMarker({
    platformClass: place.platformClass || fallbackClass,
    // `recordMaterialType` maps a missing/"all" primary onto plastic; here we
    // keep the raw value so "all" resolves to the Recycle glyph as on web.
    materialType: primary ?? '',
    secondaryMaterialType: secondary,
    isInactive: place.isActive === false,
    size: options.size,
    isHighlighted: options.isHighlighted,
  });
}

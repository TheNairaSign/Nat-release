import {
  findMaterialProfile,
  markerRadius,
  markerSpecForPlace,
  resolveMarker,
} from '../marker-engine';

const base = { size: 45 };

describe('findMaterialProfile', () => {
  it('resolves e-waste to electronics, never the metal gear', () => {
    // Web has an explicit regex guard so "e-waste" cannot fall through to
    // metal via the shared "e" substring.
    for (const t of ['e-waste', 'ewaste', 'e waste', 'laptop', 'monitor']) {
      expect(findMaterialProfile(t).key).toBe('electronics');
    }
  });

  it('falls back to "others" for empty or unknown input', () => {
    expect(findMaterialProfile('').key).toBe('others');
    expect(findMaterialProfile('unobtanium').key).toBe('others');
  });

  it('maps "all" onto the recycle glyph', () => {
    expect(findMaterialProfile('all').glyph).toBe('Recycle');
  });

  it('matches on keyword substrings', () => {
    expect(findMaterialProfile('PET bottles').key).toBe('plastic');
    expect(findMaterialProfile('Tyres').key).toBe('tire');
    expect(findMaterialProfile('prescription pills').key).toBe('drug');
  });
});

describe('resolveMarker', () => {
  it('gives every marker a glyph', () => {
    // The regression this whole module exists for: markers used to render as
    // empty coloured shapes.
    const spec = resolveMarker({ materialType: 'plastic', ...base });
    expect(spec.glyph).toBe('BottleWater');
    expect(spec.glyphSize).toBeGreaterThan(0);
  });

  it('derives shape from platformClass, not place kind', () => {
    expect(
      resolveMarker({ platformClass: 'P1', materialType: 'glass', ...base })
        .shape,
    ).toBe('squircle');
    expect(
      resolveMarker({ platformClass: 'P5A', materialType: 'glass', ...base })
        .shape,
    ).toBe('circle');
    expect(
      resolveMarker({ platformClass: 'P4', materialType: 'glass', ...base })
        .shape,
    ).toBe('pill');
    expect(
      resolveMarker({
        platformClass: 'campaign',
        materialType: 'glass',
        ...base,
      }).shape,
    ).toBe('calendar');
  });

  it('lets platform identity colour beat the material colour', () => {
    const spec = resolveMarker({
      platformClass: 'mobile',
      materialType: 'plastic',
      ...base,
    });
    expect(spec.color.bg).toBe('#d97706'); // amber, not plastic blue
  });

  it('applies the upcoming and ended event colours', () => {
    const upcoming = resolveMarker({
      platformClass: 'campaign',
      materialType: 'campaign',
      markerVariant: 'upcoming',
      ...base,
    });
    expect(upcoming.color.bg).toBe('#F5D74D');

    const ended = resolveMarker({
      platformClass: 'campaign',
      materialType: 'campaign',
      markerVariant: 'ended',
      ...base,
    });
    expect(ended.color.bg).toBe('#9ca3af');
    expect(ended.opacity).toBeCloseTo(0.55);
  });

  it('greys out inactive points and suppresses the highlight ring', () => {
    const spec = resolveMarker({
      materialType: 'plastic',
      isInactive: true,
      isHighlighted: true,
      ...base,
    });
    expect(spec.color.bg).toBe('#94a3b8');
    expect(spec.showRing).toBe(false);
  });

  it('uses a dark glyph on the yellow hazard marker', () => {
    const spec = resolveMarker({ materialType: 'biohazard', ...base });
    expect(spec.color.bg).toBe('#F5D74D');
    expect(spec.glyphColor).toBe('#1A1A1A');
  });

  it('drops the secondary badge when it duplicates the primary', () => {
    const same = resolveMarker({
      materialType: 'plastic',
      secondaryMaterialType: 'PET',
      ...base,
    });
    expect(same.secondary).toBeNull();

    const differs = resolveMarker({
      materialType: 'plastic',
      secondaryMaterialType: 'glass',
      ...base,
    });
    expect(differs.secondary?.glyph).toBe('GlassWater');
  });

  it('prefers iconMaterialType over materialType', () => {
    const spec = resolveMarker({
      materialType: 'plastic',
      iconMaterialType: 'glass',
      ...base,
    });
    expect(spec.glyph).toBe('GlassWater');
  });

  it('widens pills and heightens calendars', () => {
    const pill = resolveMarker({
      platformClass: 'P4',
      materialType: 'glass',
      ...base,
    });
    expect(pill.width).toBeGreaterThan(pill.height);

    const cal = resolveMarker({
      platformClass: 'campaign',
      materialType: 'campaign',
      ...base,
    });
    expect(cal.height).toBeGreaterThan(cal.width);
  });
});

describe('markerSpecForPlace', () => {
  it('renders a campaign as a calendar with its material as the badge', () => {
    const spec = markerSpecForPlace(
      { kind: 'campaign', materials: ['plastic'], phase: 'live' },
      { size: 45 },
    );
    expect(spec.shape).toBe('calendar');
    expect(spec.glyph).toBe('CalendarDays');
    expect(spec.secondary?.glyph).toBe('BottleWater');
  });

  it('defaults regular places to P1 and simple places to P5A', () => {
    expect(
      markerSpecForPlace({ kind: 'regular', materials: ['glass'] }, base).shape,
    ).toBe('squircle');
    expect(
      markerSpecForPlace({ kind: 'simple', materials: ['glass'] }, base).shape,
    ).toBe('circle');
  });

  it('honours an explicit platformClass over the kind default', () => {
    const spec = markerSpecForPlace(
      { kind: 'regular', materials: ['glass'], platformClass: 'P5B' },
      base,
    );
    expect(spec.shape).toBe('circle');
  });

  it('marks a place inactive when isActive is false', () => {
    const spec = markerSpecForPlace(
      { kind: 'simple', materials: ['glass'], isActive: false },
      base,
    );
    expect(spec.color.bg).toBe('#94a3b8');
  });
});

describe('markerRadius', () => {
  it('makes circles and pills fully round', () => {
    expect(markerRadius('circle', 40, 40)).toBe(20);
    expect(markerRadius('pill', 60, 40)).toBe(20);
  });

  it('uses the web 28% / 18% corner ratios', () => {
    expect(markerRadius('squircle', 50, 50)).toBe(14);
    expect(markerRadius('calendar', 50, 50)).toBe(9);
  });
});

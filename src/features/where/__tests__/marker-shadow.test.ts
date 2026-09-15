import { markerShadow } from '../ui/MapMarkerPin';

describe('markerShadow', () => {
  // Verbatim from client IconEngine.tsx — the inset layers are the bevel that
  // stops pins reading as flat.
  it('uses the default bevel + 14px coloured glow', () => {
    expect(markerShadow('59,130,246', false, false)).toBe(
      'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -2px 3px rgba(0,0,0,0.30), 0 5px 14px rgba(59,130,246,0.50), 0 1px 4px rgba(0,0,0,0.14)',
    );
  });

  it('strengthens the glow when highlighted', () => {
    expect(markerShadow('59,130,246', true, false)).toContain(
      '0 8px 22px rgba(59,130,246,0.65)',
    );
  });

  it('drops the colour for ended/inactive pins', () => {
    const shadow = markerShadow('59,130,246', true, true);
    expect(shadow).not.toContain('59,130,246');
    expect(shadow).toContain('0 2px 8px rgba(0,0,0,0.12)');
  });

  it('always includes an inset bevel', () => {
    for (const [h, e] of [[false, false], [true, false], [false, true]] as const) {
      expect(markerShadow('1,2,3', h, e)).toMatch(/^inset /);
    }
  });
});

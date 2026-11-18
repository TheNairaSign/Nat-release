import {
  markerSizeForZoom,
  markerSpecForPlace,
  pinIconSizeExpression,
  pinImageKey,
  pinMaxSize,
} from '@/core/where';

/** Evaluates the interpolate expression at a zoom, as the map would. */
function sizeAt(expr: unknown[], zoom: number): number {
  const stops = expr.slice(3) as number[];
  for (let i = 0; i < stops.length - 2; i += 2) {
    const [z0, v0, z1, v1] = [stops[i]!, stops[i + 1]!, stops[i + 2]!, stops[i + 3]!];
    if (zoom >= z0 && zoom <= z1) return v0 + ((v1 - v0) * (zoom - z0)) / (z1 - z0);
  }
  return stops[stops.length - 1]!;
}

describe('pin layer', () => {
  it('scales a pin picture to the same size the view markers had at each zoom', () => {
    for (const highlighted of [false, true]) {
      const expr = pinIconSizeExpression(highlighted, 1.2);
      const max = pinMaxSize(highlighted, 1.2);
      for (const zoom of [8, 11, 12, 12.5, 13, 16]) {
        const want = Math.round(markerSizeForZoom(zoom, highlighted) * 1.2);
        expect(Math.abs(sizeAt(expr, zoom) * max - want)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('gives one picture per look', () => {
    const glass = markerSpecForPlace({ kind: 'simple', materials: ['glass'] }, { size: 64 });
    const glassAgain = markerSpecForPlace({ kind: 'simple', materials: ['glass'] }, { size: 64 });
    const paper = markerSpecForPlace({ kind: 'simple', materials: ['paper'] }, { size: 64 });
    const open = markerSpecForPlace(
      { kind: 'simple', materials: ['glass'] },
      { size: 67, isHighlighted: true },
    );
    expect(pinImageKey(glass)).toBe(pinImageKey(glassAgain));
    expect(pinImageKey(glass)).not.toBe(pinImageKey(paper));
    expect(pinImageKey(glass)).not.toBe(pinImageKey(open));
  });

  it('pins are half as big again as before', () => {
    expect(pinMaxSize(false, 1.2) / pinMaxSize(false, 0.8)).toBeCloseTo(1.5, 1);
  });
});

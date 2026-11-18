/**
 * Pins drawn natively by the map (a symbol layer) instead of as views over it. Each
 * distinct pin look becomes one picture, drawn once at its largest size and scaled by the
 * map with zoom, so pins keep their place while the map moves.
 */

import type { MarkerSpec } from './marker-engine';
import { markerSizeForZoom } from './where';

/** The same look always gets the same picture name, so it's only drawn once. */
export function pinImageKey(spec: MarkerSpec): string {
  const s = spec.secondary;
  return [
    'pin',
    spec.event ?? 'place',
    spec.shape,
    spec.color.bg,
    spec.color.ring,
    spec.color.glowRgb,
    spec.iconUrl ?? spec.glyph,
    spec.glyphColor,
    spec.width,
    spec.height,
    spec.opacity,
    spec.showRing ? 'ring' : '',
    s ? `${s.glyph}/${s.bg}/${s.glyphColor}/${s.size}` : '',
  ].join('|');
}

/** The largest a pin gets: the size its picture is drawn at. */
export function pinMaxSize(highlighted: boolean, scale: number): number {
  return Math.round(markerSizeForZoom(24, highlighted) * scale);
}

/**
 * The map's icon size by zoom: the pin's size at that zoom over its picture's size. The
 * sizing curve only changes between about zoom 10 and 14, so stops every half zoom
 * there, plus the ends, reproduce it exactly where it matters.
 */
export function pinIconSizeExpression(highlighted: boolean, scale: number): unknown[] {
  const max = pinMaxSize(highlighted, scale);
  const stops: number[] = [];
  for (let z = 0; z <= 22; z += z >= 9 && z < 15 ? 0.5 : 3) {
    stops.push(z, Math.round(markerSizeForZoom(z, highlighted) * scale) / max);
  }
  return ['interpolate', ['linear'], ['zoom'], ...stops];
}

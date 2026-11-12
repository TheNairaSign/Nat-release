import { Image, View } from 'react-native';

import { markerRadius, type MarkerSpec } from '@/core/where';
import { MaterialGlyph } from '@/shared/ui/icons/materialGlyphRegistry';

/**
 * Renders one map marker from a `MarkerSpec` (see core/where/marker-engine).
 *
 * Mirrors the web IconEngine marker: coloured body in the platform's shape,
 * white 20% hairline border, material glyph centred inside, coloured drop-glow,
 * an optional highlight ring, and the secondary-material badge bottom-right.
 */
/**
 * The three shadow states from web's IconEngine, verbatim:
 *   ended/inactive — faint bevel, neutral 8px drop
 *   highlighted    — stronger bevel, 22px coloured glow at 0.65
 *   default        — bevel, 14px coloured glow at 0.50
 */
export function markerShadow(
  glowRgb: string,
  highlighted: boolean,
  ended: boolean,
): string {
  if (ended) {
    return 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.12)';
  }
  if (highlighted) {
    return `inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 4px rgba(0,0,0,0.38), 0 8px 22px rgba(${glowRgb},0.65), 0 2px 6px rgba(0,0,0,0.18)`;
  }
  return `inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -2px 3px rgba(0,0,0,0.30), 0 5px 14px rgba(${glowRgb},0.50), 0 1px 4px rgba(0,0,0,0.14)`;
}

export function MapMarkerPin({ spec }: { spec: MarkerSpec }) {
  const { color, shape, width, height, opacity, showRing, secondary } = spec;
  const radius = markerRadius(shape, width, height);

  return (
    <View
      style={{
        width: showRing ? width + 8 : width,
        height: showRing ? height + 8 : height,
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      {/* `ring-2 ring-offset-1` — a halo outside the body, not a border on it. */}
      {showRing ? (
        <View
          style={{
            position: 'absolute',
            width: width + 6,
            height: height + 6,
            borderRadius: radius + 3,
            borderWidth: 2,
            borderColor: color.ring,
          }}
        />
      ) : null}

      <View
        style={{
          width,
          height,
          borderRadius: radius,
          backgroundColor: color.bg,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          // Web's exact box-shadow (IconEngine.tsx). The two `inset` layers are
          // a top highlight and a bottom shade — the bevel that makes a pin
          // read as a raised button. Android's `elevation` gave only a flat
          // grey drop with no bevel and no colour, which is why markers looked
          // "flattened" and stacked pins were indistinguishable. RN's native
          // boxShadow (New Architecture) renders this on iOS and Android, and
          // react-native-web passes it through as CSS.
          boxShadow: markerShadow(color.glowRgb, showRing, opacity < 1),
        }}
      >
        {spec.iconUrl ? (
          // URS's own icon is black artwork; web turns it white with a CSS filter,
          // native does the same with tintColor.
          <Image
            testID="where-pin-urs-icon"
            source={{ uri: spec.iconUrl }}
            style={{
              width: spec.glyphSize,
              height: spec.glyphSize,
              tintColor: spec.glyphColor,
            }}
            resizeMode="contain"
          />
        ) : (
          <MaterialGlyph
            name={spec.glyph}
            color={spec.glyphColor}
            size={spec.glyphSize}
          />
        )}
      </View>

      {secondary ? (
        <View
          style={{
            position: 'absolute',
            // web: bottom-0 right-0 with translate(25%, 25%)
            right: -Math.round(secondary.size * 0.25),
            bottom: -Math.round(secondary.size * 0.25),
            width: secondary.size,
            height: secondary.size,
            borderRadius: secondary.size / 2,
            backgroundColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            // web: `shadow-md` on the secondary-material badge
            boxShadow:
              '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
          }}
        >
          <View
            style={{
              width: secondary.size - 2,
              height: secondary.size - 2,
              borderRadius: (secondary.size - 2) / 2,
              backgroundColor: secondary.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialGlyph
              name={secondary.glyph}
              color={secondary.glyphColor}
              size={Math.round(secondary.size * 0.52)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

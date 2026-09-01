import { View } from 'react-native';

import { markerRadius, type MarkerSpec } from '@/core/where';
import { MaterialGlyph } from '@/shared/ui/icons/materialGlyphRegistry';

/**
 * Renders one map marker from a `MarkerSpec` (see core/where/marker-engine).
 *
 * Mirrors the web IconEngine marker: coloured body in the platform's shape,
 * white 20% hairline border, material glyph centred inside, coloured drop-glow,
 * an optional highlight ring, and the secondary-material badge bottom-right.
 */
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
          // Coloured glow, matching the web box-shadow's rgba(glowRgb, .5)
          shadowColor: `rgb(${color.glowRgb})`,
          shadowOpacity: showRing ? 0.65 : 0.5,
          shadowRadius: showRing ? 11 : 7,
          shadowOffset: { width: 0, height: showRing ? 8 : 5 },
          elevation: showRing ? 8 : 5,
        }}
      >
        <MaterialGlyph
          name={spec.glyph}
          color={spec.glyphColor}
          size={spec.glyphSize}
        />
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
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: 3,
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

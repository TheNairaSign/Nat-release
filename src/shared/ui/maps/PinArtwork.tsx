import { Image, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { markerRadius, type MarkerSpec } from '@/core/where';
import { HarvestGlyph } from '@/shared/ui/icons/HarvestGlyph';
import { MaterialGlyph } from '@/shared/ui/icons/materialGlyphRegistry';

/**
 * One map pin as a picture the map itself can draw (a Mapbox symbol image), so pins move
 * with the map instead of trailing it as views laid over the top.
 *
 * The map turns this view into a bitmap. On Android that flattening drops view shadows
 * and rounded corners, so everything with a shape or a glow is drawn in SVG, which comes
 * through intact; only the glyph sits on top as a view, centred on the body.
 */

/** The rainbow of the open event pin, as XD's angular gradient lists it. */
const RAINBOW = ['#FF7777', '#FF84FF', '#8AF6FF', '#6C8EFF', '#FF8383'];
const RAINBOW_SLICES = 48;

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i]! - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** The colour at a point round the circle, 0..1 clockwise from the top. */
export function rainbowAt(t: number): string {
  const span = t * (RAINBOW.length - 1);
  const i = Math.min(RAINBOW.length - 2, Math.floor(span));
  return mix(RAINBOW[i]!, RAINBOW[i + 1]!, span - i);
}

/** Slices of a circle, each its own colour: SVG has no angular gradient. */
function RainbowDisc({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const slices = [];
  for (let i = 0; i < RAINBOW_SLICES; i += 1) {
    // A hair of overlap so no seam shows between neighbouring slices.
    const a0 = (i / RAINBOW_SLICES) * 2 * Math.PI - Math.PI / 2 - 0.01;
    const a1 = ((i + 1) / RAINBOW_SLICES) * 2 * Math.PI - Math.PI / 2 + 0.01;
    const d = `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 0 1 ${
      cx + r * Math.cos(a1)
    },${cy + r * Math.sin(a1)} Z`;
    slices.push(<Path key={i} d={d} fill={rainbowAt((i + 0.5) / RAINBOW_SLICES)} />);
  }
  return <G>{slices}</G>;
}

function hexagonPoints(cx: number, cy: number, w: number, h: number): string {
  const rx = w / 2;
  const ry = h / 2;
  return [
    [cx, cy - ry],
    [cx + rx, cy - ry / 2],
    [cx + rx, cy + ry / 2],
    [cx, cy + ry],
    [cx - rx, cy + ry / 2],
    [cx - rx, cy - ry / 2],
  ]
    .map((p) => p.join(','))
    .join(' ');
}

/** The pin's outline in a shape, inset or outset by `grow`. */
function BodyShape({
  spec,
  cx,
  cy,
  grow = 0,
  ...paint
}: {
  spec: MarkerSpec;
  cx: number;
  cy: number;
  grow?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const w = spec.width + grow * 2;
  const h = spec.height + grow * 2;
  if (spec.shape === 'hexagon') {
    return <Polygon points={hexagonPoints(cx, cy, w, h)} {...paint} />;
  }
  const r = markerRadius(spec.shape, spec.width, spec.height) + grow;
  return <Rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={r} ry={r} {...paint} />;
}

/** Room round the body for the glow, the ring and the badge. */
export function pinBleed(spec: MarkerSpec): number {
  return Math.round(Math.max(spec.width, spec.height) * 0.45);
}

export function PinArtwork({
  spec,
  onGlyphLoad,
}: {
  spec: MarkerSpec;
  /** A remote URS icon arrives after the first draw: the map image is redrawn then. */
  onGlyphLoad?: () => void;
}) {
  const bleed = pinBleed(spec);
  const W = spec.width + bleed * 2;
  const H = spec.height + bleed * 2;
  const cx = W / 2;
  const cy = H / 2;
  const { color, secondary } = spec;

  let artwork;
  if (spec.event === 'default') {
    // XD: #FF9656 circle, a hard shadow 2 right and 5 down at 23%.
    const r = spec.width / 2;
    artwork = (
      <>
        <Circle cx={cx + (2 * r) / 20.5} cy={cy + (5 * r) / 20.5} r={r} fill="#000000" fillOpacity={0.231} />
        <Circle cx={cx} cy={cy} r={r} fill={color.bg} />
      </>
    );
  } else if (spec.event === 'selected') {
    // XD: 52 circle, angular rainbow, shadow 0 3 6 at 16%.
    const r = spec.width / 2;
    artwork = (
      <>
        <Defs>
          <RadialGradient id="drop" cx="50%" cy="50%" r="50%">
            <Stop offset="0.7" stopColor="#000000" stopOpacity={0.16} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy + (3 * r) / 26} r={r + (6 * r) / 26} fill="url(#drop)" />
        <RainbowDisc cx={cx} cy={cy} r={r} />
      </>
    );
  } else {
    // Web IconEngine: a coloured glow under the body, a top highlight and bottom shade
    // (the bevel), a white 20% hairline, and the ring when it's the open place.
    const ended = spec.opacity < 1;
    artwork = (
      <>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0.45" stopColor={`rgb(${color.glowRgb})`} stopOpacity={ended ? 0 : spec.showRing ? 0.6 : 0.45} />
            <Stop offset="1" stopColor={`rgb(${color.glowRgb})`} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="bevel" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={0.16} />
            <Stop offset="0.3" stopColor="#ffffff" stopOpacity={0} />
            <Stop offset="0.75" stopColor="#000000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.28} />
          </LinearGradient>
        </Defs>
        <Rect
          x={cx - spec.width / 2 - bleed * 0.8}
          y={cy - spec.height / 2 - bleed * 0.55}
          width={spec.width + bleed * 1.6}
          height={spec.height + bleed * 1.6}
          rx={(spec.width + bleed * 1.6) / 2}
          fill="url(#glow)"
        />
        {spec.showRing ? (
          <BodyShape spec={spec} cx={cx} cy={cy} grow={3} fill="none" stroke={color.ring} strokeWidth={2} />
        ) : null}
        <BodyShape spec={spec} cx={cx} cy={cy} fill={color.bg} />
        <BodyShape spec={spec} cx={cx} cy={cy} fill="url(#bevel)" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      </>
    );
  }

  const badge = secondary
    ? {
        cx: cx + spec.width / 2 - secondary.size * 0.25,
        cy: cy + spec.height / 2 - secondary.size * 0.25,
        r: secondary.size / 2,
      }
    : null;

  return (
    <View testID="where-pin-artwork" style={{ width: W, height: H, opacity: spec.opacity }}>
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        {artwork}
        {badge && secondary ? (
          <>
            <Circle cx={badge.cx} cy={badge.cy + 1.5} r={badge.r + 1} fill="#000000" fillOpacity={0.1} />
            <Circle cx={badge.cx} cy={badge.cy} r={badge.r} fill="#ffffff" />
            <Circle cx={badge.cx} cy={badge.cy} r={badge.r - 1} fill={secondary.bg} />
          </>
        ) : null}
      </Svg>

      <View
        style={{
          position: 'absolute',
          left: cx - spec.glyphSize / 2,
          top: cy - spec.glyphSize / 2,
          width: spec.glyphSize,
          height: spec.glyphSize,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {spec.event ? (
          <HarvestGlyph size={spec.glyphSize} color={spec.glyphColor} />
        ) : spec.iconUrl ? (
          <Image
            testID="where-pin-urs-icon"
            source={{ uri: spec.iconUrl }}
            onLoad={onGlyphLoad}
            style={{ width: spec.glyphSize, height: spec.glyphSize, tintColor: spec.glyphColor }}
            resizeMode="contain"
          />
        ) : (
          <MaterialGlyph name={spec.glyph} color={spec.glyphColor} size={spec.glyphSize} />
        )}
      </View>

      {badge && secondary ? (
        <View
          style={{
            position: 'absolute',
            left: badge.cx - secondary.size * 0.26,
            top: badge.cy - secondary.size * 0.26,
            width: secondary.size * 0.52,
            height: secondary.size * 0.52,
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
      ) : null}
    </View>
  );
}

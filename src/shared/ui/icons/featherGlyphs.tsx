import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from 'react-native-svg';

/**
 * Feather icons used by the AI landing capability tiles, transcribed from
 * `react-icons/fi` (the exact geometry the web client renders).
 *
 * Feather is stroke-based, not filled — every shape uses `stroke` with
 * width 2, round caps and round joins, and no fill.
 */
export type FeatherGlyphProps = {
  color: string;
  size: number;
};

const stroke = {
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

export function MapPinGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        {...stroke}
      />
      <Circle cx="12" cy="10" r="3" stroke={color} {...stroke} />
    </Svg>
  );
}

export function CalendarGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        stroke={color}
        {...stroke}
      />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} {...stroke} />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} {...stroke} />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} {...stroke} />
    </Svg>
  );
}

export function TrendingUpGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polyline
        points="23 6 13.5 15.5 8.5 10.5 1 18"
        stroke={color}
        {...stroke}
      />
      <Polyline points="17 6 23 6 23 12" stroke={color} {...stroke} />
    </Svg>
  );
}

/**
 * lucide-react `MoreVertical` (aliased to `EllipsisVertical`): three r=1
 * circles at cy 5 / 12 / 19 on a 24×24 box, stroked at width 2. Used for the
 * AI chat options button.
 */
export function MoreVerticalGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="5" r="1" stroke={color} {...stroke} />
      <Circle cx="12" cy="12" r="1" stroke={color} {...stroke} />
      <Circle cx="12" cy="19" r="1" stroke={color} {...stroke} />
    </Svg>
  );
}

/** Feather `FiPackage` — the Materials row icon in the Where search panel. */
export function PackageGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1="16.5" y1="9.4" x2="7.5" y2="4.21" stroke={color} {...stroke} />
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        {...stroke}
      />
      <Polyline
        points="3.27 6.96 12 12.01 20.73 6.96"
        stroke={color}
        {...stroke}
      />
      <Line x1="12" y1="22.08" x2="12" y2="12" stroke={color} {...stroke} />
    </Svg>
  );
}

/**
 * Heroicons `HiOfficeBuilding` — the Organizations row icon. Unlike the
 * Feather set this one is filled, on a 20x20 box, and needs evenodd fill.
 */
export function BuildingGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
        fill={color}
      />
    </Svg>
  );
}

/** Feather `FiCamera` — the change-photo control on the profile avatar. */
export function CameraGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        {...stroke}
      />
      <Circle cx="12" cy="13" r="4" stroke={color} {...stroke} />
    </Svg>
  );
}

/** FiArrowUpRight; web draws it at strokeWidth 2.5 on the tokens stat. */
export function ArrowUpRightGlyph({
  color,
  size,
  strokeWidth = 2,
}: FeatherGlyphProps & { strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1="7" y1="17" x2="17" y2="7" stroke={color} {...stroke} strokeWidth={strokeWidth} />
      <Polyline points="7 7 17 7 17 17" stroke={color} {...stroke} strokeWidth={strokeWidth} />
    </Svg>
  );
}

/** FiCheck; web's "Your tier" mark uses strokeWidth 3. */
export function CheckGlyph({
  color,
  size,
  strokeWidth = 2,
}: FeatherGlyphProps & { strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polyline points="20 6 9 17 4 12" stroke={color} {...stroke} strokeWidth={strokeWidth} />
    </Svg>
  );
}

/** FiExternalLink */
export function ExternalLinkGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke={color} {...stroke} />
      <Polyline points="15 3 21 3 21 9" stroke={color} {...stroke} />
      <Line x1="10" y1="14" x2="21" y2="3" stroke={color} {...stroke} />
    </Svg>
  );
}

/** FiAlertTriangle */
export function AlertTriangleGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        {...stroke}
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} {...stroke} />
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} {...stroke} />
    </Svg>
  );
}

/** FiClock */
export function ClockGlyph({ color, size }: FeatherGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" stroke={color} {...stroke} />
      <Polyline points="12 6 12 12 16 14" stroke={color} {...stroke} />
    </Svg>
  );
}

/** FiStar; web fills it (`fill-[#F5B301]`) once rated. */
export function FeatherStarGlyph({
  color,
  size,
  filled = false,
  strokeWidth = 2,
}: FeatherGlyphProps & { filled?: boolean; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        stroke={color}
        {...stroke}
        strokeWidth={strokeWidth}
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}

/** FiMic; web draws it at strokeWidth 1.8 in the Ask DiVA box. */
export function MicGlyph({
  color,
  size,
  strokeWidth = 2,
}: FeatherGlyphProps & { strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke={color} {...stroke} strokeWidth={strokeWidth} />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={color} {...stroke} strokeWidth={strokeWidth} />
      <Line x1="12" y1="19" x2="12" y2="23" stroke={color} {...stroke} strokeWidth={strokeWidth} />
      <Line x1="8" y1="23" x2="16" y2="23" stroke={color} {...stroke} strokeWidth={strokeWidth} />
    </Svg>
  );
}

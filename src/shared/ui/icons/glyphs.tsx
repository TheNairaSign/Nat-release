import { Circle, Path, Polyline, Svg } from 'react-native-svg';

type IconProps = {
  color: string;
  size?: number;
};

export function HomeGlyph({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StarGlyph({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 3.2 14.6 9l6.4.6-4.8 4.2 1.5 6.3L12 16.8 6.3 20.1 7.8 13.8 3 9.6 9.4 9 12 3.2Z" />
    </Svg>
  );
}

export function PinGlyph({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Circle cx="12" cy="9" r="2.2" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function UserGlyph({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.2" stroke={color} strokeWidth={1.8} />
      <Path
        d="M5.5 19c.8-3.2 3.2-5 6.5-5s5.7 1.8 6.5 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ChevronGlyph({
  color,
  size = 12,
  direction = 'down',
}: IconProps & { direction?: 'up' | 'down' | 'left' | 'right' }) {
  const points =
    direction === 'down'
      ? '6 9 12 15 18 9'
      : direction === 'up'
        ? '6 15 12 9 18 15'
        : direction === 'left'
          ? '15 6 9 12 15 18'
          : '9 6 15 12 9 18';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points={points}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchGlyph({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.2" stroke={color} strokeWidth={1.8} />
      <Path
        d="M16.2 16.2 20 20"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function FilterGlyph({ color, size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M7 12h10M10 18h4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CloseGlyph({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6 6 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BellGlyph({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 16h12l-1.2-2.2V10a4.8 4.8 0 1 0-9.6 0v3.8L6 16Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M10 18a2 2 0 0 0 4 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function GiftGlyph({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11h16v9H4V11Z" stroke={color} strokeWidth={1.8} />
      <Path d="M3 7h18v4H3V7Z" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 7v13M12 7c-2-3-5-3-5 0 0 2 2.5 2.5 5 0Zm0 0c2-3 5-3 5 0 0 2-2.5 2.5-5 0Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BookmarkGlyph({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChartGlyph({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a9 9 0 1 0 9 9h-9V3Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M13.5 3.3A9 9 0 0 1 20.7 10.5H13.5V3.3Z"
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export function BoltGlyph({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z" />
    </Svg>
  );
}

export function BullhornGlyph({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10v4l9 3V7L4 10Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M13 9.5c2 .8 4.5 1 6.5.5v4c-2-.5-4.5-.3-6.5.5"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M7 14.5v3.2a1.8 1.8 0 0 0 3.2 1.1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CogGlyph({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 3.5v2.2M12 18.3v2.2M4.8 7.2l1.9 1.1M17.3 15.7l1.9 1.1M4.8 16.8l1.9-1.1M17.3 8.3l1.9-1.1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SignOutGlyph({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M14 12H21M18 8l4 4-4 4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchTargetGlyph({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="7" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 5v2.5M12 16.5V19M5 12h2.5M16.5 12H19"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

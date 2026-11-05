import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * A CSS-style `linear-gradient(<angle>deg, …)` filling its parent, for backgrounds such
 * as web's "Ask Diva" pill. Put it first inside a view with `overflow: 'hidden'`.
 */
export function GradientFill({
  angle,
  stops,
}: {
  /** CSS degrees: 0 points up, 90 to the right. */
  angle: number;
  stops: { offset: number; color: string }[];
}) {
  const id = useId().replace(/:/g, '');
  // CSS angles run clockwise from "up"; turn that into a start and end point.
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) / 2;
  const dy = -Math.cos(rad) / 2;
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient
          id={id}
          x1={0.5 - dx}
          y1={0.5 - dy}
          x2={0.5 + dx}
          y2={0.5 + dy}
        >
          {stops.map((stop) => (
            <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

import { PanResponder, type GestureResponderEvent, type PanResponderInstance } from 'react-native';

/** How far in a pinch can go (web usePinchZoom caps around this). */
export const MAX_PINCH = 5;

function spread(event: GestureResponderEvent): number | null {
  const touches = event.nativeEvent.touches;
  const a = touches[0];
  const b = touches[1];
  if (!a || !b) return null;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

/**
 * Two fingers apart to zoom in, together to zoom out (web hooks/usePinchZoom): reports a
 * scale from 1 to MAX_PINCH. One finger is left alone, for taps. Kept outside the
 * component so its gesture state is plain variables.
 */
export function createPinchResponder({
  getScale,
  onScale,
}: {
  getScale: () => number;
  onScale: (scale: number) => void;
}): PanResponderInstance {
  let startSpread: number | null = null;
  let startScale = 1;
  return PanResponder.create({
    onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
    onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
    onPanResponderGrant: (e) => {
      startSpread = spread(e);
      startScale = getScale();
    },
    onPanResponderMove: (e) => {
      const now = spread(e);
      if (now === null) return;
      if (startSpread === null) {
        startSpread = now;
        startScale = getScale();
        return;
      }
      const next = Math.min(MAX_PINCH, Math.max(1, (startScale * now) / startSpread));
      onScale(next);
    },
    onPanResponderRelease: () => {
      startSpread = null;
    },
    onPanResponderTerminate: () => {
      startSpread = null;
    },
  });
}

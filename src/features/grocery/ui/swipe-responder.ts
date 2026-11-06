import { Animated, PanResponder, type PanResponderInstance } from 'react-native';

/**
 * How far a grocery card must travel for a release to count, as a share of its width
 * (web HistoryItemRow). Throwing away asks for more than marking used: it's heavier.
 */
export const USED_AT = 0.33;
export const DELETE_AT = 0.5;
/** Dragging stops here, so the row never leaves the screen. */
const MAX_PULL = 0.72;
/** Below this it's still ambiguous with a scroll. */
const SLOP = 8;

export type SwipeCommit = 'used' | 'deleted' | null;

/**
 * The sideways swipe on a grocery card: right marks it used, left throws it away. Kept
 * outside the component so its drag state is plain variables, not React state.
 */
export function createSwipeResponder({
  x,
  width,
  enabled,
  onDrag,
  onArm,
  onCommit,
}: {
  x: Animated.Value;
  width: number;
  enabled: boolean;
  /** Every move, for the colour and words behind the card. */
  onDrag: (dx: number) => void;
  /** The moment letting go would act (for a haptic nudge). */
  onArm: () => void;
  onCommit: (commit: Exclude<SwipeCommit, null>) => void;
}): PanResponderInstance {
  let armed: SwipeCommit = null;
  const commitFor = (dx: number): SwipeCommit => {
    if (dx >= width * USED_AT) return 'used';
    if (dx <= -width * DELETE_AT) return 'deleted';
    return null;
  };
  return PanResponder.create({
    // Only a clearly sideways drag is ours; vertical is left to the list's scroll.
    onMoveShouldSetPanResponder: (_e, g) =>
      enabled && Math.abs(g.dx) > SLOP && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_e, g) => {
      const limit = width * MAX_PULL;
      const next = Math.max(-limit, Math.min(limit, g.dx));
      const commit = commitFor(next);
      if (commit !== armed) {
        if (commit) onArm();
        armed = commit;
      }
      x.setValue(next);
      onDrag(next);
    },
    onPanResponderRelease: (_e, g) => {
      const commit = commitFor(g.dx);
      armed = null;
      if (!commit) {
        Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
        onDrag(0);
        return;
      }
      // Carry it off the way it was going, then let it settle back in its new state.
      Animated.timing(x, {
        toValue: commit === 'used' ? width : -width,
        duration: 170,
        useNativeDriver: true,
      }).start(() => {
        x.setValue(0);
        onDrag(0);
        onCommit(commit);
      });
    },
  });
}

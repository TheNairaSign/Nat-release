import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { GradientFill } from '@/shared/ui/GradientFill';

const HEIGHTS = { md: [14, 20, 24, 18, 12], lg: [14, 22, 30, 22, 16] };

/**
 * The DiVA bar's waveform: still when idle, dancing while listening or speaking. "lg" is
 * History's 51×30 wave, dark green fading to near-black (web components/grocery/VoiceBars).
 */
export function VoiceBars({
  active,
  fast,
  size = 'md',
}: {
  active: boolean;
  fast?: boolean;
  size?: 'md' | 'lg';
}) {
  const lg = size === 'lg';
  const [scales] = useState(() => HEIGHTS.md.map(() => new Animated.Value(1)));

  useEffect(() => {
    if (!active) {
      scales.forEach((s) => s.setValue(1));
      return;
    }
    const period = fast ? 380 : 620;
    const loops = scales.map((s, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 90),
          Animated.timing(s, { toValue: 0.4, duration: period / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(s, { toValue: 1, duration: period / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, fast, scales]);

  return (
    <View style={{ height: lg ? 30 : 24, flexDirection: 'row', alignItems: 'center', gap: lg ? 4 : 3 }}>
      {HEIGHTS[size].map((h, i) => (
        <Animated.View
          key={i}
          style={{
            width: lg ? 7 : 4,
            height: h,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: lg ? undefined : '#14361B',
            transform: [{ scaleY: scales[i] ?? 1 }],
          }}
        >
          {lg ? (
            <GradientFill angle={180} stops={[{ offset: 0, color: '#0A5A14' }, { offset: 1, color: '#021204' }]} />
          ) : null}
        </Animated.View>
      ))}
    </View>
  );
}

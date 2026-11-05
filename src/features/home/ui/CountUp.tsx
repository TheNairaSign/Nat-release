import { useEffect, useState } from 'react';
import type { TextStyle } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { useTheme } from '@/shared/theme';

export function CountUp({
  to,
  durationMs = 1100,
  style,
}: {
  to: number;
  durationMs?: number;
  /** Replaces the default 24pt look (Home's meter uses 17pt). */
  style?: TextStyle;
}) {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / durationMs);
      setValue(Math.round(to * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, durationMs]);

  return (
    <Text
      style={
        style ?? {
          fontSize: 24,
          fontFamily: theme.font.bold,
          color: theme.color.text,
          lineHeight: 28,
          fontVariant: ['tabular-nums'],
        }
      }
    >
      {value.toLocaleString('en-US')}
    </Text>
  );
}

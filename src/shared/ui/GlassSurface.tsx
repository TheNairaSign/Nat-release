import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/shared/theme';

/**
 * A frosted-glass surface: a blurred backdrop with a translucent white sheet
 * painted over it.
 *
 * Mirrors the web nav (MobileNav.tsx:72-78), which is
 * `background: rgba(255,255,255,0.55)` plus
 * `backdrop-filter: blur(20px) saturate(180%)`. React Native has no backdrop
 * blur of its own, so expo-blur provides it; on web that maps back to the same
 * CSS filter (intensity * 0.2 = blur px, and it applies saturate(180%) itself).
 *
 * Vendor import lives here rather than in a feature, per the layering rule.
 */
export function GlassSurface({
  children,
  style,
  contentStyle,
  testID,
}: {
  children: ReactNode;
  testID?: string;
  /** Outer frame — radius, border, shadow. Must clip (`overflow: hidden`). */
  style?: StyleProp<ViewStyle>;
  /** Inner padding/layout for the content sheet. */
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View testID={testID} style={[{ overflow: 'hidden' }, style]}>
      <BlurView
        intensity={theme.glass.blurIntensity}
        tint="default"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[{ backgroundColor: theme.glass.fillOverBlur }, contentStyle]}
      >
        {children}
      </View>
    </View>
  );
}

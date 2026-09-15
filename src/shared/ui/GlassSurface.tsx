import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

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

  // dimezisBlurView needs API 31+ to composite reliably; below that Android
  // falls back to no blur, so the surface has to carry its own opacity.
  const blurIsReliable =
    Platform.OS === 'ios' ||
    Platform.OS === 'web' ||
    (Platform.OS === 'android' && Number(Platform.Version) >= 31);

  return (
    <View testID={testID} style={[{ overflow: 'hidden' }, style]}>
      <BlurView
        intensity={theme.glass.blurIntensity}
        tint="default"
        // Android's blur is opt-in: `blurMethod` defaults to 'none', which
        // renders BlurView as a plain translucent box. Without this the bar was
        // see-through on the APK and page content collided with the tab labels.
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          {
            // Where the platform gives no real blur, the surface must carry
            // enough opacity to stay legible on its own.
            backgroundColor: blurIsReliable
              ? theme.glass.fillOverBlur
              : theme.glass.fillOpaque,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

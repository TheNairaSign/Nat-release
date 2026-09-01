import { Image, View, type ImageStyle, type StyleProp } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { EARTH_WATERMARK_XML } from '@/shared/ui/brand/earth-watermark';
import { GREEN_IMPACT_ICON_XML } from '@/shared/ui/brand/green-impact-icon';
import { ILLUSTRATION_XML } from '@/shared/ui/brand/illustration';
import { TM_MARK_XML } from '@/shared/ui/brand/tm-mark';
import { useTheme } from '@/shared/theme';

import logo from '@/assets/brand/logo.png';

export function BrandLogo({
  width,
  height,
  style,
}: {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
}) {
  const theme = useTheme();
  const h = height ?? (width ? width * 0.26 : theme.layout.logoWidth * 0.26);
  const w = width ?? (height ? height / 0.26 : theme.layout.logoWidth);
  return (
    <Image
      source={logo}
      accessibilityLabel="NatCycle Logo"
      resizeMode="contain"
      style={[{ width: w, height: h }, style]}
    />
  );
}

export function BrandIllustration({
  height,
  style,
}: {
  height?: number;
  style?: StyleProp<ImageStyle>;
}) {
  const theme = useTheme();
  const h = height ?? theme.layout.illustrationMaxHeight;
  // Web: `h-[min(24vh,8rem)] w-auto object-contain` — width follows the SVG's
  // intrinsic 213.998 x 195.308 ratio.
  return (
    <View style={style}>
      <SvgXml
        xml={ILLUSTRATION_XML}
        height={h}
        width={h * theme.layout.illustrationAspect}
      />
    </View>
  );
}

export function GreenImpactIcon() {
  const theme = useTheme();
  // Web: `w-[25px] h-[29px] object-contain` (Dashboard.tsx:253-257)
  return (
    <SvgXml
      xml={GREEN_IMPACT_ICON_XML}
      width={theme.layout.impactIconWidth}
      height={theme.layout.impactIconHeight}
    />
  );
}

export function EarthWatermark({ size }: { size?: number }) {
  const theme = useTheme();
  const dim = size ?? theme.layout.earthWatermark;
  // Web: `w-[7.5rem] h-[7.5rem] opacity-[0.12]` (Dashboard.tsx:246-251)
  return (
    <SvgXml xml={EARTH_WATERMARK_XML} width={dim} height={dim} opacity={0.12} />
  );
}

export function ThingsMatchMark() {
  const theme = useTheme();
  return (
    <SvgXml
      xml={TM_MARK_XML}
      width={theme.layout.tmMarkWidth}
      height={theme.layout.tmMarkHeight}
      accessible={false}
    />
  );
}

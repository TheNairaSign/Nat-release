import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { TM_MARK_XML } from '@/shared/ui/brand/tm-mark';
import { useTheme } from '@/shared/theme';

import earthWatermark from '@/assets/brand/earth-watermark.png';
import illustration from '@/assets/brand/illustration.png';
import impactIcon from '@/assets/brand/impact-icon.png';
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
  resizeMode = 'contain',
  style,
}: {
  height?: number;
  resizeMode?: 'contain' | 'cover';
  style?: StyleProp<ImageStyle>;
}) {
  const theme = useTheme();
  const h = height ?? theme.layout.illustrationMaxHeight;
  return (
    <Image
      source={illustration}
      accessible={false}
      resizeMode={resizeMode}
      style={[
        {
          height: h,
          aspectRatio: theme.layout.illustrationAspect,
        },
        style,
      ]}
    />
  );
}

export function GreenImpactIcon() {
  const theme = useTheme();
  return (
    <Image
      source={impactIcon}
      accessible={false}
      resizeMode="contain"
      style={{
        width: theme.layout.impactIconWidth,
        height: theme.layout.impactIconHeight,
      }}
    />
  );
}

export function EarthWatermark({ size }: { size?: number }) {
  const theme = useTheme();
  const dim = size ?? theme.layout.earthWatermark;
  return (
    <Image
      source={earthWatermark}
      accessible={false}
      resizeMode="contain"
      style={{ width: dim, height: dim, opacity: 0.12 }}
    />
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

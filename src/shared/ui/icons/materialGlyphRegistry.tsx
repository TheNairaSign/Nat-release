import type { ReactElement } from 'react';

import { Image } from 'react-native';

import type { GlyphName } from '@/core/where';

import {
  BookGlyph,
  BottleWaterGlyph,
  BoxOpenGlyph,
  BurgerGlyph,
  CalendarDaysGlyph,
  CouchGlyph,
  FileGlyph,
  GearGlyph,
  GlassWaterGlyph,
  LaptopGlyph,
  LeafGlyph,
  MobileScreenGlyph,
  RecycleGlyph,
  ShirtGlyph,
  ShoePrintsGlyph,
  type MaterialGlyphProps,
} from './materialGlyphs';

/**
 * Four materials have no FontAwesome equivalent — web ships them as PNGs and
 * recolours the black artwork to white with a CSS filter. Native has no such
 * filter, so `tintColor` does the same job. Biohazard keeps its black glyph
 * (web passes `invert={false}`) because it sits on brand yellow.
 */
const RASTER: Partial<Record<GlyphName, { src: number; tint: boolean }>> = {
  Tire: {
    src: require('../../../../assets/images/whereicon/tire.png'),
    tint: true,
  },
  Paint: {
    src: require('../../../../assets/images/whereicon/paint.png'),
    tint: true,
  },
  Drug: {
    src: require('../../../../assets/images/whereicon/drug.png'),
    tint: true,
  },
  Biohazard: {
    src: require('../../../../assets/images/whereicon/biohazard.png'),
    tint: false,
  },
};

const VECTOR: Partial<
  Record<GlyphName, (p: MaterialGlyphProps) => ReactElement>
> = {
  BottleWater: BottleWaterGlyph,
  File: FileGlyph,
  GlassWater: GlassWaterGlyph,
  Gear: GearGlyph,
  Leaf: LeafGlyph,
  Book: BookGlyph,
  Shirt: ShirtGlyph,
  Laptop: LaptopGlyph,
  Burger: BurgerGlyph,
  Couch: CouchGlyph,
  ShoePrints: ShoePrintsGlyph,
  Recycle: RecycleGlyph,
  CalendarDays: CalendarDaysGlyph,
  MobileScreen: MobileScreenGlyph,
  BoxOpen: BoxOpenGlyph,
};

export function MaterialGlyph({
  name,
  color,
  size,
}: {
  name: GlyphName;
  color: string;
  size: number;
}) {
  const raster = RASTER[name];
  if (raster) {
    return (
      <Image
        source={raster.src}
        resizeMode="contain"
        style={{
          width: size,
          height: size,
          // Web recolours the black artwork to white with a CSS
          // `brightness(0) invert(1)` filter; tintColor is the native
          // equivalent. Biohazard opts out, matching `invert={false}`.
          ...(raster.tint ? { tintColor: color } : null),
        }}
      />
    );
  }

  const Vector = VECTOR[name] ?? RecycleGlyph;
  return <Vector color={color} size={size} />;
}

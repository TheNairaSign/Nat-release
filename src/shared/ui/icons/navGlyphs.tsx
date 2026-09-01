// GENERATED — do not hand-edit.
//
// The bottom-nav icons, extracted from the exact react-icons the web client
// uses in src/pages/dashboard/components/dashboardNav.tsx:
//   Home  BiHome   (BoxIcons, outline)  size 20
//   Star  FaStar   (FontAwesome, solid) size 18
//   User  FaUser   (FontAwesome, solid) size 18
//   Pin   FiMapPin (Feather, stroke)    size 20  -> see featherGlyphs
//
// Web deliberately mixes three families here; these were previously
// hand-drawn approximations, which is why they did not match.

import Svg, { Path } from 'react-native-svg';

export type NavGlyphProps = {
  color: string;
  size: number;
};

export function NavHomeGlyph({ color, size }: NavGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13zm7 7v-5h4v5h-4zm2-15.586 6 6V15l.001 5H16v-5c0-1.103-.897-2-2-2h-4c-1.103 0-2 .897-2 2v5H6v-9.586l6-6z"
        fill={color}
      />
    </Svg>
  );
}

export function NavStarGlyph({ color, size }: NavGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 576 512">
      <Path
        d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"
        fill={color}
      />
    </Svg>
  );
}

export function NavUserGlyph({ color, size }: NavGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 448 512">
      <Path
        d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"
        fill={color}
      />
    </Svg>
  );
}

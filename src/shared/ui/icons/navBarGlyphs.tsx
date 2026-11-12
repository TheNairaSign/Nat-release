// The bottom bar's own icons, from web's MobileNav.tsx (the new prototype): plain filled
// shapes. Star and user reuse navGlyphs; these two differ from the old set.

import Svg, { Path } from 'react-native-svg';

import type { NavGlyphProps } from './navGlyphs';

/** Filled house with a door, as drawn (Subtraction 66), 14x15. */
export function NavHomeFilledGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={15} viewBox="0 0 14 15">
      <Path
        fillRule="evenodd"
        d="M6.1.4a1.4 1.4 0 0 1 1.8 0l5.6 4.6c.3.3.5.7.5 1.1v7.4c0 .8-.6 1.5-1.4 1.5H9.2V10.6a2.2 2.2 0 0 0-4.4 0V15H1.4C.6 15 0 14.3 0 13.5V6.1c0-.4.2-.8.5-1.1L6.1.4Z"
        fill={color}
      />
    </Svg>
  );
}

/** FontAwesome FaMapMarkerAlt (solid). */
export function NavMapMarkerGlyph({ color, size }: NavGlyphProps) {
  return (
    <Svg width={(size * 384) / 512} height={size} viewBox="0 0 384 512">
      <Path
        d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"
        fill={color}
      />
    </Svg>
  );
}

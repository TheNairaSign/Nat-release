#!/usr/bin/env node
/**
 * Regenerates src/shared/ui/icons/materialGlyphs.tsx from the exact
 * FontAwesome 6 path data the web client uses.
 *
 * The web IconEngine (client/src/services/IconEngine.tsx) imports its material
 * icons from `react-icons/fa6`. Rather than redrawing those glyphs by hand —
 * which is how the marker icons drifted in the first place — we read the real
 * path data out of the web app's own dependency.
 *
 * Usage (from app/mobile):
 *   node scripts/gen-material-glyphs.mjs ../../client
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const clientDir = resolve(process.argv[2] ?? '../../client');
const require = createRequire(resolve(clientDir, 'package.json'));
const fa = require('react-icons/fa6');

/** Keep in sync with the `MATERIALS` table in the web IconEngine. */
const NAMES = [
  'FaBottleWater', 'FaFile', 'FaGlassWater', 'FaGear', 'FaLeaf', 'FaBook',
  'FaShirt', 'FaLaptop', 'FaBurger', 'FaCouch', 'FaShoePrints', 'FaRecycle',
  'FaCalendarDays', 'FaMobileScreen', 'FaBoxOpen', 'FaStar',
  // Used by the Impact breakdown card (client ImpactBreakdownCard.tsx), which
  // picks FaBox / FaBiohazard / FaCapsules rather than the marker equivalents.
  'FaBox', 'FaBiohazard', 'FaCapsules',
  // AI chat composer send button.
  'FaPaperPlane',
];

function extract(name) {
  const el = fa[name]({});
  const paths = [];
  const walk = (node) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.props) {
      if (node.type === 'path' && node.props.d) paths.push(node.props.d);
      walk(node.props.children);
    }
  };
  walk(el.props.children);
  return { viewBox: el.props.attr.viewBox, d: paths };
}

let out = `// GENERATED — do not hand-edit.
//
// Source of truth: the exact FontAwesome 6 path data used by the web client
// (client/src/services/IconEngine.tsx imports these from react-icons/fa6).
// Regenerate with scripts/gen-material-glyphs.mjs after any web icon change.
//
// These are the material glyphs drawn inside Where-page markers. Before this
// file existed the markers rendered as empty coloured shapes.

import Svg, { Path } from 'react-native-svg';

export type MaterialGlyphProps = {
  color: string;
  size: number;
};

`;

for (const name of NAMES) {
  const { viewBox, d } = extract(name);
  const comp = `${name.replace(/^Fa/, '')}Glyph`;
  const paths = d.map((p) => `      <Path d="${p}" fill={color} />`).join('\n');
  out += `export function ${comp}({ color, size }: MaterialGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="${viewBox}">
${paths}
    </Svg>
  );
}

`;
}

const dest = new URL('../src/shared/ui/icons/materialGlyphs.tsx', import.meta.url);
writeFileSync(dest, out);
console.log(`wrote ${NAMES.length} glyphs to ${dest.pathname}`);

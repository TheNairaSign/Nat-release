import Svg, { Rect } from 'react-native-svg';

/**
 * The Waste Apps mark (prototype Group 16477; web components/icons/WasteAppsIcon): a 2x2
 * grid of 8pt squares, 3pt corners, 4pt apart. In the header and on the Waste Apps page.
 */
export function WasteAppsMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect x="0" y="0" width="8" height="8" rx="3" fill="#409D72" />
      <Rect x="12" y="0" width="8" height="8" rx="3" fill="#9CD105" />
      <Rect x="0" y="12" width="8" height="8" rx="3" fill="#0C3422" />
      <Rect x="12" y="12" width="8" height="8" rx="3" fill="#33D503" />
    </Svg>
  );
}

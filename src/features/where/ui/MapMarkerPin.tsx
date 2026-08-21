import { View } from 'react-native';

import type { MarkerShape } from '@/core/where';

export function MapMarkerPin({
  color,
  size,
  shape,
  selected,
  inactive,
}: {
  color: string;
  size: number;
  shape: MarkerShape;
  selected?: boolean;
  inactive?: boolean;
}) {
  const radius =
    shape === 'circle'
      ? size / 2
      : shape === 'calendar'
        ? 6
        : Math.max(8, size * 0.22);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: inactive ? '#9ca3af' : color,
        borderWidth: selected ? 3 : 2,
        borderColor: selected ? '#111111' : 'rgba(255,255,255,0.9)',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }}
    />
  );
}

import { View } from 'react-native';

import { breakdownIcon, type BreakdownIcon } from '@/core/impact';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import {
  BiohazardGlyph,
  BookGlyph,
  BottleWaterGlyph,
  BoxGlyph,
  CapsulesGlyph,
  FileGlyph,
  GearGlyph,
  GlassWaterGlyph,
  LaptopGlyph,
  LeafGlyph,
  RecycleGlyph,
  ShirtGlyph,
} from '@/shared/ui/icons/materialGlyphs';

/** `text-xl text-slate-600`, size 20 — with two per-material overrides. */
const SLATE_600 = '#475569';
const ICON_COLORS: Partial<Record<BreakdownIcon, string>> = {
  biohazard: '#B45309',
  capsules: '#FF9A9A',
};

export function BreakdownGlyph({ materialType }: { materialType?: string }) {
  const name = breakdownIcon(materialType ?? '');
  const props = { color: ICON_COLORS[name] ?? SLATE_600, size: 20 };

  switch (name) {
    case 'bottle-water':
      return <BottleWaterGlyph {...props} />;
    case 'shirt':
      return <ShirtGlyph {...props} />;
    case 'wine-glass':
      return <GlassWaterGlyph {...props} />;
    case 'leaf':
      return <LeafGlyph {...props} />;
    case 'file-text':
      return <FileGlyph {...props} />;
    case 'book':
      return <BookGlyph {...props} />;
    case 'cog':
      return <GearGlyph {...props} />;
    case 'laptop':
      return <LaptopGlyph {...props} />;
    case 'can':
      return <BoxGlyph {...props} />;
    case 'biohazard':
      return <BiohazardGlyph {...props} />;
    case 'capsules':
      return <CapsulesGlyph {...props} />;
    case 'recycle':
    default:
      return <RecycleGlyph {...props} />;
  }
}

/**
 * Port of client/src/pages/dashboard/components/ImpactBreakdownCard.tsx (main 964a78a,
 * prototype Flow 3 HOME – 45): a pale #F3FBFB card, 20pt corners, the CU in a lime
 * #D3FD5D pill. The icon only where a material type is given (the See-all grid);
 * Impact's sideways rows pass none.
 */
export function ImpactBreakdownCard({
  label,
  quantity,
  unitLabel,
  carbonUnits,
  materialType,
  width,
}: {
  label: string;
  quantity: number;
  unitLabel: string;
  carbonUnits: number;
  materialType?: string;
  /** Impact's rows: 145pt; the grid lets it fill its column. */
  width?: number;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        ...(width ? { width } : { flex: 1 }),
        height: 88,
        backgroundColor: '#F3FBFB',
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingTop: 15,
        paddingBottom: 11,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ flexShrink: 1, fontSize: 12, lineHeight: 14, color: '#010B02' }}
        >
          {label}
        </Text>
        {materialType ? <BreakdownGlyph materialType={materialType} /> : null}
      </View>

      <View
        style={{
          marginTop: 'auto',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 18,
              lineHeight: 22,
              fontFamily: theme.font.bold,
              color: '#1C0F28',
              fontVariant: ['tabular-nums'],
            }}
          >
            {Math.round(quantity)}
          </Text>
          <Text style={{ fontSize: 12, lineHeight: 14, color: '#1C0F28', opacity: 0.45 }}>
            {unitLabel}
          </Text>
        </View>
        <View
          style={{
            height: 27,
            justifyContent: 'center',
            borderRadius: 14,
            backgroundColor: '#D3FD5D',
            paddingHorizontal: 12,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: theme.font.bold,
              color: '#010B02',
              fontVariant: ['tabular-nums'],
            }}
          >
            {Math.round(carbonUnits)} CU
          </Text>
        </View>
      </View>
    </View>
  );
}

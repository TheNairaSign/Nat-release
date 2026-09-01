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
 * Port of client/src/pages/dashboard/components/ImpactBreakdownCard.tsx.
 *
 *   bg-[#D1FF52] rounded-2xl p-4 shadow-sm min-h-[100px]
 *   flex flex-col justify-between
 *     row 1: items-start justify-between — label left, material icon right
 *     row 2: items-end   justify-between — "<qty> <unit>" left, CU pill right
 *
 * The previous version had no icon, no space-between, and put the CU pill on
 * its own line left-aligned.
 */
export function ImpactBreakdownCard({
  label,
  quantity,
  unitLabel,
  carbonUnits,
  materialType,
}: {
  label: string;
  quantity: number;
  unitLabel: string;
  carbonUnits: number;
  materialType?: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.color.lime,
        borderRadius: theme.radius.lg,
        padding: 16,
        minHeight: 100,
        justifyContent: 'space-between',
        ...theme.shadow.sm,
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
          style={{
            flexShrink: 1,
            fontSize: 14,
            fontFamily: theme.font.regular,
            color: theme.color.text,
          }}
        >
          {label}
        </Text>
        <BreakdownGlyph materialType={materialType} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 8,
        }}
      >
        <Text style={{ flexShrink: 1, color: theme.color.text }}>
          <Text style={{ fontSize: 18, fontFamily: theme.font.bold }}>
            {Math.round(quantity)}
          </Text>
          <Text style={{ fontSize: 14, color: '#334155' }}> {unitLabel}</Text>
        </Text>
        <View
          style={{
            backgroundColor: '#1A1A1A',
            borderRadius: theme.radius.pill,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: '#ffffff' }}>
            <Text style={{ fontFamily: theme.font.bold, color: '#ffffff' }}>
              {Math.round(carbonUnits)}
            </Text>
            <Text style={{ fontFamily: theme.font.regular, color: '#ffffff' }}>
              {' '}
              CU
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

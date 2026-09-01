import { View } from 'react-native';

import { campaignMaterialIcon } from '@/core/campaigns';
import {
  BiohazardGlyph,
  BottleWaterGlyph,
  CapsulesGlyph,
} from '@/shared/ui/icons/materialGlyphs';
import {
  CheckroomGlyph,
  ForestGlyph,
  WineBottleGlyph,
} from '@/shared/ui/icons/campaignGlyphs';

/**
 * The material badge web overlays on a campaign card image
 * (`absolute top-2 left-2 bg-white p-2 rounded-full shadow-sm`).
 * Drug and hazard materials render on their own coloured 28px disc.
 */
export function CampaignMaterialIcon({
  materialType,
}: {
  materialType: string;
}) {
  const icon = campaignMaterialIcon(materialType);
  const size = icon.badgeBg ? 16 : 24;
  const props = { color: icon.color, size };

  const glyph =
    icon.name === 'bottle-water' ? (
      <BottleWaterGlyph {...props} />
    ) : icon.name === 'checkroom' ? (
      <CheckroomGlyph {...props} />
    ) : icon.name === 'wine-bottle' ? (
      <WineBottleGlyph {...props} />
    ) : icon.name === 'capsules' ? (
      <CapsulesGlyph {...props} />
    ) : icon.name === 'biohazard' ? (
      <BiohazardGlyph {...props} />
    ) : (
      <ForestGlyph {...props} />
    );

  if (!icon.badgeBg) return glyph;

  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: icon.badgeBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glyph}
    </View>
  );
}

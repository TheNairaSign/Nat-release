export type CampaignLocation = {
  name: string;
  address?: string;
  material?: string;
};

export type CampaignCard = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  materialType?: string;
  materialTypes: string[];
  progress: number;
  goal: number;
  endDate?: string;
  startDate?: string;
  status?: string;
  isIndefinite?: boolean;
  locations: CampaignLocation[];
};

export function campaignProgressPct(progress: number, goal: number): number {
  if (!goal) return 0;
  return Math.min(Math.round((progress / goal) * 100), 100);
}

export function isUrgentCampaign(
  startDate?: string,
  now = new Date(),
): boolean {
  if (!startDate) return false;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return false;
  const diff = start.getTime() - now.getTime();
  return diff >= 0 && diff <= 7 * 86400000;
}

export function endsLabel(endDate?: string, isIndefinite?: boolean): string {
  if (isIndefinite) return 'Ongoing Campaign';
  if (!endDate) return '';
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return '';
  return `Ends: ${date.toLocaleDateString()}`;
}

export function filterCampaigns(
  items: CampaignCard[],
  material?: string | null,
): CampaignCard[] {
  if (!material) return items;
  const q = material.toLowerCase();
  return items.filter((item) => (item.materialType ?? '').toLowerCase() === q);
}

export type CampaignIconName =
  | 'bottle-water'
  | 'checkroom'
  | 'wine-bottle'
  | 'forest'
  | 'capsules'
  | 'biohazard';

export type CampaignIcon = {
  name: CampaignIconName;
  /** Glyph colour. */
  color: string;
  /** When set, the glyph sits on a 28px filled circle (web's `w-7 h-7`). */
  badgeBg?: string;
};

/**
 * Icon + colour for a campaign's material, from `getIconForMaterialType` in
 * client/src/pages/dashboard/campaign/CampaignsPage.tsx:60-107.
 *
 * This is a **third** distinct material→icon table in the web app, separate
 * from the Where marker engine and the Impact breakdown card — it picks
 * different glyphs (MdForest for paper, FaWineBottle for glass) and different
 * colours. Keep them separate rather than merging.
 */
export function campaignMaterialIcon(materialType: string): CampaignIcon {
  const t = (materialType || '').toLowerCase();

  if (t.includes('plastic')) return { name: 'bottle-water', color: '#16a34a' };
  if (t.includes('fabric') || t.includes('textile')) {
    return { name: 'checkroom', color: '#2563eb' };
  }
  if (t.includes('glass')) return { name: 'wine-bottle', color: '#d97706' };
  if (t.includes('paper') || t.includes('cardboard')) {
    return { name: 'forest', color: '#166534' };
  }
  if (
    t.includes('drug') ||
    t.includes('medicine') ||
    t.includes('medication') ||
    t.includes('pharma')
  ) {
    return { name: 'capsules', color: '#ffffff', badgeBg: '#FF9A9A' };
  }
  if (t.includes('hazard') || t.includes('biohazard') || t.includes('toxic')) {
    return { name: 'biohazard', color: '#1A1A1A', badgeBg: '#F5D74D' };
  }
  return { name: 'forest', color: '#16a34a' };
}

/** Web: `campaign.materialTypes[0] || "All"`, tolerating a bare string. */
export function campaignMaterialType(
  materialTypes: string[] | string | undefined,
): string {
  if (Array.isArray(materialTypes)) return materialTypes[0] || 'All';
  return materialTypes || 'All';
}

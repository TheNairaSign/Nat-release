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

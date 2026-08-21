export type RewardItem = {
  id: string;
  name: string;
  description?: string;
  pointsRequired: number;
  sponsorName?: string;
  imageUrl?: string;
  redeemed: boolean;
};

export type RewardFilter = 'all' | 'available' | 'redeemed';

export function filterRewards(
  items: RewardItem[],
  filter: RewardFilter,
  points: number,
): {
  affordable: RewardItem[];
  keepCollecting: RewardItem[];
  emptyTitle: string;
  emptyBody: string;
} {
  const redeemed = items.filter((item) => item.redeemed);
  const available = items.filter((item) => !item.redeemed);
  if (filter === 'redeemed') {
    return {
      affordable: redeemed,
      keepCollecting: [],
      emptyTitle: 'No Redeemed Rewards Yet',
      emptyBody: 'Start redeeming rewards to see them here!',
    };
  }
  const pool =
    filter === 'available' ? available : items.filter((item) => !item.redeemed);
  const affordable = pool.filter((item) => item.pointsRequired <= points);
  const keepCollecting = pool.filter((item) => item.pointsRequired > points);
  if (filter === 'available') {
    return {
      affordable,
      keepCollecting,
      emptyTitle: 'No Available Rewards',
      emptyBody: 'Check back later…',
    };
  }
  return {
    affordable,
    keepCollecting,
    emptyTitle: 'No Rewards Available',
    emptyBody: 'Check back later…',
  };
}

export function pointsNeeded(pointsRequired: number, points: number): number {
  return Math.max(0, pointsRequired - points);
}

export const REWARD_SHARE_URL = 'https://natcycle.app';

export type RewardSharePlatform =
  'twitter' | 'facebook' | 'whatsapp' | 'linkedin';

export function rewardShareText(name: string): string {
  return `🎁 Just redeemed "${name}" on NatCycle! Making sustainable choices rewarding! 🌱 #NatCycle #Sustainability #EcoRewards`;
}

export function rewardShareUrl(
  platform: RewardSharePlatform,
  name: string,
): string {
  const text = rewardShareText(name);
  const shareUrl = REWARD_SHARE_URL;
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  }
}

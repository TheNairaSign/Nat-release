export const PROFILE_APP_VERSION = '1.0.1';
export const THINGSMATCH_APP_URL = 'https://thingsmatch.com/app';

export const PROFILE_ACTIVITY = [
  {
    id: 'dropoffs',
    title: 'My Drop-offs',
    subtitle: 'View your recycling history',
    href: '/dropoff/all',
    highlight: false,
    icon: 'search',
  },
  {
    id: 'rewards',
    title: 'Rewards',
    subtitle: 'Redeem your NatPoints',
    href: '/rewards',
    highlight: false,
    icon: 'gift',
  },
  {
    id: 'impact',
    title: 'Green Profile',
    subtitle: 'Your environmental impact',
    href: '/impact',
    highlight: true,
    icon: 'bolt',
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    subtitle: 'View upcoming campaigns',
    href: '/campaigns',
    highlight: true,
    icon: 'bullhorn',
  },
] as const;

export function displayName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Member';
}

export function natPoints(pointsEarned?: number, point?: number): number {
  return Math.round(pointsEarned || point || 0);
}

export function cuSaved(carbonUnits?: number): string {
  return `${(carbonUnits || 0).toFixed(1)} CU`;
}

export function avatarFallbackUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=random&color=fff&rounded=true`;
}

export const IMPACT_MEASUREMENTS = [
  { id: 'trees', label: 'Trees Planted' },
  { id: 'carbon', label: 'Carbon Footprint' },
  { id: 'water', label: 'Water Footprint' },
  { id: 'birds', label: 'Birds Saved' },
] as const;

export const DROPOFF_SUCCESS_KEY = 'dropoffSuccess';
export const PENDING_DROPOFF_KEY = 'pendingDropoff';

export type DropoffMode = 'simple' | 'campaign';

export function parseDropoffMode(raw?: string): DropoffMode {
  return raw === 'campaign' ? 'campaign' : 'simple';
}

export function createDropoffHref(input: {
  type?: string;
  mode?: DropoffMode;
  locationId?: string;
  campaignId?: string;
  campaignName?: string;
  campaignLocationIndex?: number;
}): string {
  const params = new URLSearchParams();
  if (input.type) params.set('type', input.type);
  if (input.mode) params.set('mode', input.mode);
  if (input.locationId) params.set('locationId', input.locationId);
  if (input.campaignId) params.set('campaignId', input.campaignId);
  if (input.campaignName) params.set('campaignName', input.campaignName);
  if (input.campaignLocationIndex != null) {
    params.set('campaignLocationIndex', String(input.campaignLocationIndex));
  }
  const query = params.toString();
  return query ? `/dropoff/create?${query}` : '/dropoff/create';
}

export function distanceKmLabel(km?: number | null): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  return `${km.toFixed(1)} km away`;
}

export function canSubmitSimple(
  hasPhoto: boolean,
  quantities: Record<string, number>,
): boolean {
  return hasPhoto && Object.values(quantities).some((value) => value > 0);
}

export function canSubmitCampaign(
  hasPhoto: boolean,
  count: number,
  hasCampaign: boolean,
): boolean {
  return hasPhoto && hasCampaign && count > 0;
}

export function dateTooOld(
  date: Date,
  now: Date,
  createdAt?: string,
): string | null {
  if (date > now) return 'Drop-off date cannot be in the future.';
  if (createdAt) {
    const joined = new Date(createdAt);
    if (!Number.isNaN(joined.getTime()) && date < joined) {
      return 'Drop-off date cannot be before your account was created.';
    }
  }
  const oldest = new Date(now);
  oldest.setDate(oldest.getDate() - 90);
  oldest.setHours(0, 0, 0, 0);
  if (date < oldest)
    return 'Drop-off date cannot be more than 90 days in the past';
  return null;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function isFutureMonth(date: Date, now: Date): boolean {
  const a = startOfMonth(date).getTime();
  const b = startOfMonth(now).getTime();
  return a > b;
}

export function inMonth(iso: string, month: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === month.getFullYear() &&
    date.getMonth() === month.getMonth()
  );
}

export function monthTitle(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatDropoffWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function truncateName(name: string, max = 13): string {
  const compact = name.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max)}…`;
}

export function kindBadge(kind: 'regular' | 'simple' | 'campaign'): string {
  if (kind === 'simple') return 'Static drop-off';
  if (kind === 'campaign') return 'Campaign';
  return 'Regular';
}

export type DropoffSuccessPayload = {
  carbonUnits: number;
  materialType?: string;
  dropoffType: 'simple' | 'campaign' | 'regular';
};

export function successShareText(carbonUnits: number): string {
  const cu = carbonUnits.toFixed(2);
  return `Just completed a drop-off and earned ${cu} Carbon Units! Join me in making the world greener with NatCycle! 🌱`;
}

/**
 * Colour for a drop-off's status line, from `UserDropOffs.tsx:409-418`:
 *
 *   Approved | Verified  → green-600
 *   Pending             → orange-500
 *   anything else       → red-500
 *
 * The mobile history rows previously showed no status at all, so a rejected
 * drop-off was indistinguishable from an approved one.
 */
export function dropoffStatusColor(status?: string): string {
  if (status === 'Approved' || status === 'Verified') return '#16a34a';
  if (status === 'Pending') return '#f97316';
  return '#ef4444';
}

export type DropoffShareInput = {
  materialType: string;
  carbonUnitsEarned: number;
  kind: 'regular' | 'simple' | 'campaign';
  locationName?: string;
  campaignName?: string;
};

function capitalizeFirst(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Share copy for one drop-off, from the `dropoff` templates in
 * client/src/utils/socialTemplates.ts.
 *
 * The mobile share buttons were sending the share *modal's subtitle*
 * ("Show off your environmental impact!") as the message body, so no material,
 * CU value, location or campaign ever made it into the share.
 */
export function dropoffShareText(input: DropoffShareInput): string {
  const material = capitalizeFirst(input.materialType || 'materials');
  const cu = input.carbonUnitsEarned;

  if (input.kind === 'campaign' && input.campaignName) {
    const tag = input.campaignName.replace(/\s+/g, '');
    return `🎯 Participated in "${input.campaignName}" campaign! Just dropped off ${material} materials and earned ${cu} Carbon Units. Join the movement! 🌍 #NatCycle #${tag} #SustainableCampaign`;
  }

  if (input.kind === 'simple' && input.locationName) {
    return `🌿 Static drop-off completed at ${input.locationName}! ${material} materials → ${cu} CU earned. Making sustainability simple! ♻️ #NatCycle #EcoFriendly`;
  }

  return `✅ Just completed an eco-friendly dropoff! ${material} → ${cu} Carbon Units earned. Small steps, big impact! 🌱 #NatCycle #Sustainability #${material}Recycling`;
}

/**
 * Share copy for the overall profile/impact, from the `achievement` templates.
 */
export function impactShareText(
  totalDropoffs: number,
  carbonUnits: number,
): string {
  return `🌍 Making a difference, one dropoff at a time! My journey with NatCycle: ${totalDropoffs} dropoffs completed, ${Math.floor(carbonUnits)} Carbon Units saved. Together, we can build a sustainable future! 💚 #SustainableLiving #NatCycle`;
}

export type CampaignLike = {
  id?: string;
  _id?: string;
  status?: string;
  isIndefinite?: boolean;
  scheduleType?: 'range' | 'dates' | 'indefinite' | string;
  openDates?: (string | Date | { date?: string })[];
  endDate?: string | null;
  startDate?: string | null;
  timeMode?: string;
  sharedTimeSlots?: { start?: string; end?: string }[];
};

function toDayKey(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function openDateKeys(campaign: CampaignLike): string[] {
  const raw = campaign.openDates;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const keys = new Set<string>();
  for (const item of raw) {
    const key =
      typeof item === 'object' && item !== null && !(item instanceof Date)
        ? toDayKey(item.date)
        : toDayKey(item);
    if (key) keys.add(key);
  }
  return [...keys].sort();
}

function resolveScheduleType(
  campaign: CampaignLike,
): 'range' | 'dates' | 'indefinite' {
  if (
    campaign.scheduleType === 'dates' ||
    campaign.scheduleType === 'range' ||
    campaign.scheduleType === 'indefinite'
  ) {
    return campaign.scheduleType;
  }
  if (openDateKeys(campaign).length > 0) return 'dates';
  if (campaign.isIndefinite) return 'indefinite';
  return 'range';
}

export function getCampaignPhase(
  campaign: CampaignLike,
  now: Date = new Date(),
): 'upcoming' | 'live' | 'ended' {
  if (campaign.status === 'completed' || campaign.status === 'cancelled')
    return 'ended';
  if (campaign.status && campaign.status !== 'active') return 'ended';
  const today = toDayKey(now) ?? '';
  const scheduleType = resolveScheduleType(campaign);
  const keys = openDateKeys(campaign);
  if (scheduleType === 'dates' && keys.length > 0) {
    if (keys.includes(today)) return 'live';
    if (keys.some((key) => key > today)) return 'upcoming';
    return 'ended';
  }
  if (scheduleType === 'indefinite') {
    const startKey = toDayKey(campaign.startDate);
    if (startKey && startKey > today) return 'upcoming';
    return 'live';
  }
  const startKey = toDayKey(campaign.startDate);
  if (startKey && startKey > today) {
    const endKey = toDayKey(campaign.endDate);
    if (!endKey || endKey >= today) return 'upcoming';
    return 'ended';
  }
  if (campaign.endDate) {
    const end = new Date(campaign.endDate);
    if (!Number.isNaN(end.getTime()) && end < now) return 'ended';
  }
  return 'live';
}

function formatDay(key: string): string {
  const date = new Date(`${key}T12:00:00`);
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric' });
}

export function formatCampaignSchedule(
  campaign: CampaignLike,
  now: Date = new Date(),
): string {
  const keys = openDateKeys(campaign);
  const scheduleType = resolveScheduleType(campaign);
  if (scheduleType === 'dates' && keys.length > 0) {
    const today = toDayKey(now) ?? '';
    if (keys.includes(today)) {
      const rest = keys.filter((key) => key !== today);
      if (rest.length === 0) return 'Open today';
      return `Open today · Next ${formatDay(rest[0] ?? today)}`;
    }
    const next = keys.find((key) => key > today);
    if (next) {
      if (keys.length === 1) return formatDay(next);
      return `${formatDay(next)} · ${keys.length} dates`;
    }
    return keys.map(formatDay).join(' · ');
  }
  const start = campaign.startDate
    ? new Date(campaign.startDate).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Date TBA';
  if (scheduleType === 'indefinite' || campaign.isIndefinite)
    return `${start} · Ongoing`;
  if (campaign.endDate) {
    const end = new Date(campaign.endDate).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    return `${start} – ${end}`;
  }
  return start;
}

export function formatCampaignHours(campaign: CampaignLike): string {
  const mode = campaign.timeMode || 'none';
  if (mode === 'none') return '';
  const slots = campaign.sharedTimeSlots ?? [];
  const labeled = slots
    .map((slot) => [slot.start, slot.end].filter(Boolean).join('–'))
    .filter(Boolean);
  return labeled.join(', ');
}

export function getCampaignId(campaign: {
  id?: string;
  _id?: string;
}): string | undefined {
  return campaign.id || campaign._id;
}

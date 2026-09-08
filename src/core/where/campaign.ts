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

/**
 * Calendar day in the **local** timezone.
 *
 * Ported from web's `toCampaignDayKey` (commit 6db3a29, "Fix campaign date
 * timezone shift"). `toISOString()` converts to UTC first, which moves the day
 * backwards west of Greenwich — Sep 9 reads as Sep 8 — so a campaign could be
 * shown as ended a day early. Prefer the calendar date already encoded in the
 * string, and otherwise read the local date parts.
 */
function toDayKey(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1] ?? null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  // Compare calendar days, not instants. A date-only `endDate` ('2026-09-09')
  // parses as midnight **UTC**, so a raw `end < now` marked an event running
  // *today* as ended as soon as local time passed that instant. Kept in step
  // with the same fix in client/src/utils/campaignUtils.ts.
  const endKey = toDayKey(campaign.endDate);
  if (endKey && endKey < today) return 'ended';
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

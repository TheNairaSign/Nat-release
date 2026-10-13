import { formatCampaignSchedule } from '../campaign';

/**
 * Ported from web's fix for "multi-date event schedule looping back to past
 * open days" (client f1bf428, src/utils/campaignUtils.ts).
 */

const NOW = new Date('2026-10-13T12:00:00');
const dates = (...keys: string[]) => ({
  scheduleType: 'dates' as const,
  openDates: keys,
});

describe('formatCampaignSchedule for multi-date events', () => {
  it('points "Next" at a future day, never back at a past one', () => {
    // Regression: filtering out only *today* left the earlier dates in place,
    // so an event open on the 10th, 13th and 20th advertised "Next Oct 10" —
    // a day already gone.
    expect(
      formatCampaignSchedule(dates('2026-10-10', '2026-10-13', '2026-10-20'), NOW),
    ).toBe('Open today · Next Oct 20');
  });

  it('says "Open today" when today is the last remaining day', () => {
    expect(
      formatCampaignSchedule(dates('2026-10-05', '2026-10-13'), NOW),
    ).toBe('Open today');
  });

  it('names the final date once every day has passed', () => {
    // Previously this listed every past date, e.g. "Oct 1 · Oct 5".
    expect(
      formatCampaignSchedule(dates('2026-10-01', '2026-10-05'), NOW),
    ).toBe('Ended · Oct 5');
  });

  it('counts the dates when the next one is still ahead', () => {
    expect(
      formatCampaignSchedule(dates('2026-10-20', '2026-10-27'), NOW),
    ).toBe('Oct 20 · 2 dates');
  });

  it('shows a single upcoming date on its own', () => {
    expect(formatCampaignSchedule(dates('2026-10-20'), NOW)).toBe('Oct 20');
  });
});

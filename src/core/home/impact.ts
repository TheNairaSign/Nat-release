const SEEDLING = { level: 1, start: 0, end: 500, name: 'Seedling' } as const;

export const IMPACT_MILESTONES = [
  SEEDLING,
  { level: 2, start: 501, end: 1000, name: 'Sprout' },
  { level: 3, start: 1001, end: 2000, name: 'Tree' },
  { level: 4, start: 2001, end: 5000, name: 'Forest' },
  { level: 5, start: 5001, end: 10000, name: 'Guardian' },
] as const;

/** The prototype's meter has 23 sticks (web Dashboard SEGMENT_COUNT, Nov 2). */
export const IMPACT_SEGMENT_COUNT = 23;

export type GreetingPeriod = 'Morning' | 'Afternoon' | 'Evening';

export function greetingPeriod(hour: number): GreetingPeriod {
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

export function homeGreeting(
  hour: number,
  guest: boolean,
  firstName?: string,
): string {
  const period = greetingPeriod(hour);
  return `Good ${period} ${guest ? 'there' : (firstName ?? '')}!`;
}

export type ImpactMeter = {
  level: number;
  name: string;
  start: number;
  end: number;
  filledSegments: number;
  displayCu: number;
};

export function impactMeter(carbonUnits: number): ImpactMeter {
  const current = Math.max(0, Number(carbonUnits) || 0);
  let index = IMPACT_MILESTONES.findIndex(
    (milestone) => current >= milestone.start && current <= milestone.end,
  );
  const last = IMPACT_MILESTONES[IMPACT_MILESTONES.length - 1] ?? SEEDLING;
  if (index === -1) {
    index = current > last.end ? IMPACT_MILESTONES.length - 1 : 0;
  }
  const milestone = IMPACT_MILESTONES[index] ?? SEEDLING;
  const span = Math.max(milestone.end - milestone.start, 1);
  const progress = Math.min(
    Math.max(((current - milestone.start) / span) * 100, 0),
    100,
  );
  const filledSegments = Math.min(
    IMPACT_SEGMENT_COUNT,
    Math.max(
      current > 0 ? 1 : 0,
      Math.round((progress / 100) * IMPACT_SEGMENT_COUNT),
    ),
  );
  return {
    level: milestone.level,
    name: milestone.name,
    start: milestone.start,
    end: milestone.end,
    filledSegments,
    displayCu: Math.floor(current),
  };
}

export function pickRandomSlice<T>(
  items: T[],
  count: number,
  random: () => number,
): T[] {
  return [...items].sort(() => 0.5 - random()).slice(0, count);
}

export function whereHref(guest: boolean, type: string | null): string {
  const base = guest ? '/guest/where' : '/where';
  if (!type) return base;
  return `${base}?type=${encodeURIComponent(type)}`;
}

export function aiHref(question?: string, suggestionId?: string): string {
  if (!question) return '/ai';
  const params = new URLSearchParams({ q: question });
  if (suggestionId) params.set('suggestionId', suggestionId);
  return `/ai?${params.toString()}`;
}

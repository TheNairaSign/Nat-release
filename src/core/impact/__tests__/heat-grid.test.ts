import { canGoNext, monthHeatWeeks, yearHeatRows } from '../impact';

describe('yearHeatRows', () => {
  it('returns exactly 7 rows, one per weekday', () => {
    expect(yearHeatRows(2025, {})).toHaveLength(7);
  });

  it('gives every row the same length (whole weeks)', () => {
    const rows = yearHeatRows(2025, {});
    const widths = new Set(rows.map((r) => r.length));
    expect(widths.size).toBe(1);
  });

  it('covers all 365 days of a common year', () => {
    const inYear = yearHeatRows(2025, {})
      .flat()
      .filter((c) => c.inPeriod);
    expect(inYear).toHaveLength(365);
  });

  it('covers 366 days of a leap year', () => {
    const inYear = yearHeatRows(2024, {})
      .flat()
      .filter((c) => c.inPeriod);
    expect(inYear).toHaveLength(366);
  });

  it('marks padding days outside the year as not in period', () => {
    const rows = yearHeatRows(2025, {});
    const padding = rows.flat().filter((c) => !c.inPeriod);
    expect(padding.length).toBeGreaterThan(0);
    expect(padding.every((c) => c.count === 0)).toBe(true);
  });

  it('applies the web level thresholds: 0, 1, 2-3, 4+', () => {
    const counts = {
      '2025-03-01': 0,
      '2025-03-02': 1,
      '2025-03-03': 3,
      '2025-03-04': 4,
    };
    const byKey = new Map(
      yearHeatRows(2025, counts)
        .flat()
        .map((c) => [c.key, c]),
    );
    expect(byKey.get('2025-03-01')?.level).toBe(0);
    expect(byKey.get('2025-03-02')?.level).toBe(1);
    expect(byKey.get('2025-03-03')?.level).toBe(2);
    expect(byKey.get('2025-03-04')?.level).toBe(3);
  });
});

describe('monthHeatWeeks', () => {
  it('pads to whole weeks with nulls', () => {
    for (const week of monthHeatWeeks(2025, 0, {})) {
      expect(week).toHaveLength(7);
    }
  });

  it('contains every day of the month', () => {
    const days = monthHeatWeeks(2025, 1, {}).flat().filter(Boolean);
    expect(days).toHaveLength(28); // Feb 2025
  });
});

describe('canGoNext', () => {
  const now = new Date(2026, 7, 24); // Aug 2026

  it('blocks paging past the current year', () => {
    expect(canGoNext('year', 2025, 0, now)).toBe(true);
    expect(canGoNext('year', 2026, 0, now)).toBe(false);
  });

  it('blocks paging past the current month', () => {
    expect(canGoNext('month', 2026, 6, now)).toBe(true); // Jul → Aug, allowed
    expect(canGoNext('month', 2026, 7, now)).toBe(false); // Aug → Sep, blocked
  });

  it('allows rolling December into the next year when in the past', () => {
    expect(canGoNext('month', 2025, 11, now)).toBe(true);
  });
});

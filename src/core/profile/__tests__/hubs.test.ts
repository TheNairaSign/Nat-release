import {
  calculateUserContributions,
  impactStats,
  lastDropoffLabel,
} from '@/core/impact';
import { displayName, natPoints } from '@/core/profile';
import { canSubmitSimple, dateTooOld, parseDropoffMode } from '@/core/dropoff';
import { filterRewards } from '@/core/rewards';

describe('profile and impact helpers', () => {
  it('formats profile identity', () => {
    expect(displayName('Ada', 'Lovelace')).toBe('Ada Lovelace');
    expect(natPoints(12.4, 0)).toBe(12);
  });

  it('counts drop-offs vs events', () => {
    expect(
      impactStats(
        [
          {
            id: '1',
            kind: 'simple',
            name: 'Bin',
            quantity: 1,
            carbonUnits: 1,
            at: '2026-01-01',
          },
          {
            id: '2',
            kind: 'campaign',
            name: 'Drive',
            quantity: 1,
            carbonUnits: 1,
            at: '2026-01-02',
            campaign: true,
          },
        ],
        4.8,
      ),
    ).toEqual({ dropoffs: 1, events: 1, bcu: 4 });
  });

  it('calculates contributions from catalog', () => {
    const rows = calculateUserContributions(
      [
        {
          id: '1',
          kind: 'regular',
          name: 'Center',
          materialType: 'plastic',
          quantity: 2,
          carbonUnits: 0,
          at: '2026-01-01',
        },
      ],
      {},
      ['plastic'],
      [{ category: 'plastic', cuValue: 1.5, isActive: true }],
    );
    expect(rows[0]?.carbonUnits).toBe(3);
  });

  it('labels last drop-off', () => {
    expect(lastDropoffLabel(undefined)).toBe('No dropoffs yet');
  });
});

describe('dropoff and rewards helpers', () => {
  it('parses mode and submit rules', () => {
    expect(parseDropoffMode('campaign')).toBe('campaign');
    expect(parseDropoffMode('simple')).toBe('simple');
    expect(canSubmitSimple(true, { plastic: 2 })).toBe(true);
    expect(canSubmitSimple(false, { plastic: 2 })).toBe(false);
  });

  it('rejects dates older than 90 days', () => {
    const now = new Date('2026-08-19');
    expect(dateTooOld(new Date('2026-01-01'), now)).toBeTruthy();
    expect(dateTooOld(new Date('2026-08-01'), now)).toBeNull();
  });

  it('splits affordable rewards', () => {
    const grouped = filterRewards(
      [
        { id: 'a', name: 'Mug', pointsRequired: 10, redeemed: false },
        { id: 'b', name: 'Bag', pointsRequired: 80, redeemed: false },
      ],
      'all',
      20,
    );
    expect(grouped.affordable).toHaveLength(1);
    expect(grouped.keepCollecting).toHaveLength(1);
  });
});

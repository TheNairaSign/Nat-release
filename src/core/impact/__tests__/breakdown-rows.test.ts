import { calculateUserContributions } from '../impact';
import type { DropoffActivity } from '../impact';

const CATALOG = [
  'plastic', 'paper', 'fabrics', 'glass', 'metal', 'organics',
  'aluminium', 'books', 'electronics', 'shoes', 'tire', 'drug', 'hazardous',
];

const dropoff = (over: Partial<DropoffActivity>): DropoffActivity => ({
  id: 'd1',
  kind: 'regular',
  name: 'Site',
  quantity: 1,
  carbonUnits: 1,
  at: '2026-09-01T10:00:00.000Z',
  ...over,
});

describe('breakdown rows', () => {
  // Regression: the Impact breakdown filtered out every material with no
  // drop-offs, so a user with one material saw a single card. Web seeds the
  // whole catalog at zero and shows the first four unfiltered, which is how
  // glass and paper appear there with no activity.
  it('keeps catalog materials the user has never dropped off', () => {
    const rows = calculateUserContributions(
      [dropoff({ materialType: 'plastic' })],
      {},
      CATALOG,
      [],
    );
    expect(rows.length).toBe(CATALOG.length);
    expect(rows.map((r) => r.materialType)).toEqual(
      expect.arrayContaining(['glass', 'paper']),
    );
  });

  it('still ranks materials with activity first', () => {
    const rows = calculateUserContributions(
      [dropoff({ materialType: 'plastic', carbonUnits: 5 })],
      {},
      CATALOG,
      [],
    );
    expect(rows[0]?.materialType).toBe('plastic');
  });

  it('leaves at least four rows for the breakdown to show', () => {
    const rows = calculateUserContributions(
      [dropoff({ materialType: 'plastic' })],
      {},
      CATALOG,
      [],
    );
    expect(rows.slice(0, 4).length).toBe(4);
  });

  it('returns nothing when the catalog fails to load and there is no activity', () => {
    expect(calculateUserContributions([], {}, [], [])).toEqual([]);
  });
});

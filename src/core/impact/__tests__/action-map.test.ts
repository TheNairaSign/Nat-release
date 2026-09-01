import {
  actionMapCircleSize,
  actionMapLabel,
  actionMapPoints,
  actionMapZoom,
} from '../impact';
import type { DropoffActivity } from '../impact';

const activity = (over: Partial<DropoffActivity>): DropoffActivity => ({
  id: 'a',
  kind: 'regular',
  name: 'Site',
  quantity: 1,
  carbonUnits: 0,
  at: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('actionMapPoints', () => {
  it('sums quantity for drop-offs at the same coordinate', () => {
    const points = actionMapPoints([
      activity({ id: '1', lat: 6.5, lng: 3.3, quantity: 4 }),
      activity({ id: '2', lat: 6.5, lng: 3.3, quantity: 6 }),
    ]);
    expect(points).toHaveLength(1);
    expect(points[0]?.quantity).toBe(10);
  });

  it('keeps distinct coordinates separate', () => {
    const points = actionMapPoints([
      activity({ id: '1', lat: 6.5, lng: 3.3 }),
      activity({ id: '2', lat: 7.1, lng: 3.9 }),
    ]);
    expect(points).toHaveLength(2);
  });

  it('drops activities with no coordinates', () => {
    expect(actionMapPoints([activity({ id: '1' })])).toHaveLength(0);
  });

  it('rejects null island and out-of-range pairs', () => {
    const points = actionMapPoints([
      activity({ id: '1', lat: 0, lng: 0 }),
      activity({ id: '2', lat: 95, lng: 3 }),
      activity({ id: '3', lat: 6, lng: 200 }),
    ]);
    expect(points).toHaveLength(0);
  });
});

describe('actionMapCircleSize', () => {
  it('spans 12px to 52px', () => {
    expect(actionMapCircleSize(0, 100)).toBe(12);
    expect(actionMapCircleSize(100, 100)).toBe(52);
  });

  it('uses a sqrt scale, so mid quantities sit above the midpoint', () => {
    // sqrt(0.25) = 0.5 → 12 + 0.5*40 = 32
    expect(actionMapCircleSize(25, 100)).toBe(32);
  });

  it('falls back to the minimum when there is no maximum', () => {
    expect(actionMapCircleSize(5, 0)).toBe(12);
  });
});

describe('actionMapZoom', () => {
  it('walks the web span ladder', () => {
    expect(actionMapZoom(3, 0)).toBe(8);
    expect(actionMapZoom(1, 0)).toBe(9);
    expect(actionMapZoom(0.5, 0)).toBe(10);
    expect(actionMapZoom(0.2, 0)).toBe(11);
    expect(actionMapZoom(0.01, 0)).toBe(11.5);
  });
});

describe('actionMapLabel', () => {
  const point = { key: 'k', lat: 1, lng: 1, quantity: 1, label: 'Ikeja Hub' };

  it('names the site when there is exactly one point', () => {
    expect(actionMapLabel([point], false)).toBe('Ikeja Hub');
  });

  it('says "Your activity" for several points', () => {
    expect(actionMapLabel([point, { ...point, key: 'k2' }], false)).toBe(
      'Your activity',
    );
  });

  it('distinguishes loading from genuinely empty', () => {
    expect(actionMapLabel([], true)).toBe('Loading…');
    expect(actionMapLabel([], false)).toBe('No drops yet');
  });
});

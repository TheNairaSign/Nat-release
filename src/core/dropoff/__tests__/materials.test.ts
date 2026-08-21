import {
  estimatedCu,
  formatCuPerItem,
  materialLinesForSite,
  quantitiesAsNumbers,
} from '@/core/dropoff';

describe('materialLinesForSite', () => {
  it('uses subtypes when present', () => {
    const lines = materialLinesForSite(
      ['plastic'],
      ['bottle', 'film'],
      [{ category: 'bottle', cuValue: 0.5 }],
    );
    expect(lines).toHaveLength(2);
    expect(lines[0]?.id).toBe('bottle');
    expect(lines[0]?.cuValue).toBe(0.5);
  });

  it('expands catch-all from catalog', () => {
    const lines = materialLinesForSite(
      ['all'],
      [],
      [
        { category: 'plastic', cuValue: 1 },
        { category: 'metal', cuValue: 2 },
      ],
    );
    expect(lines.map((line) => line.id)).toEqual(['plastic', 'metal']);
  });

  it('sums estimated CU from quantities', () => {
    const lines = materialLinesForSite(
      ['plastic', 'metal'],
      [],
      [
        { category: 'plastic', cuValue: 1.25 },
        { category: 'metal', cuValue: 2 },
      ],
    );
    const qty = quantitiesAsNumbers({ plastic: '2', metal: '0', other: '' });
    expect(qty).toEqual({ plastic: 2 });
    expect(estimatedCu(lines, { plastic: 2, metal: 1 })).toBe(4.5);
    expect(formatCuPerItem(1.256)).toBe('1.26 CU / item');
  });
});

import {
  capitalizeChip,
  isMaterialTypeMatch,
  disposeChipsOrFallback,
  mergeWhereMaterialChips,
} from '@/core/materials';

describe('material chips', () => {
  it('merges NatCycle + ThingsMatch and collapses synonyms', () => {
    expect(
      mergeWhereMaterialChips(
        ['plastic', { category: 'Food', createdAt: '2024-01-01' }],
        [{ name: 'Plastic' }, 'Fabrics', 'Furniture', 'Toys'],
      ),
    ).toEqual(['plastic', 'Food', 'Fabrics', 'Furniture', 'Toys']);
  });

  it('falls back when the API returns nothing', () => {
    expect(disposeChipsOrFallback([])).toEqual([
      'Food',
      'Plastic bottle',
      'Fabrics',
    ]);
  });

  it('capitalizes only the first character', () => {
    expect(capitalizeChip('plastic bottle')).toBe('Plastic bottle');
  });
});

describe('material aliases added on web (d89313a)', () => {
  it('matches tyre spellings against a "Tires" filter', () => {
    expect(isMaterialTypeMatch('tires', 'tyre')).toBe(true);
    expect(isMaterialTypeMatch('tire', 'tyres')).toBe(true);
  });

  it('matches drug synonyms against a "Drugs" filter', () => {
    expect(isMaterialTypeMatch('drugs', 'medication')).toBe(true);
    expect(isMaterialTypeMatch('drug', 'capsules')).toBe(true);
  });

  it('matches hazardous synonyms', () => {
    expect(isMaterialTypeMatch('hazardous', 'biohazard')).toBe(true);
    expect(isMaterialTypeMatch('hazardous', 'toxic')).toBe(true);
  });

  it('does not over-match unrelated materials', () => {
    expect(isMaterialTypeMatch('tires', 'glass')).toBe(false);
    expect(isMaterialTypeMatch('drugs', 'paper')).toBe(false);
  });
});

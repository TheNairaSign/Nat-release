import {
  capitalizeChip,
  isMaterialTypeMatch,
  disposeChipsOrFallback,
  mergeWhereMaterialChips,
} from '@/core/materials';

describe('material chips', () => {
  it('merges NatCycle + ThingsMatch without collapsing TM into diversion synonyms', () => {
    expect(
      mergeWhereMaterialChips(
        [
          { category: 'Plastic', createdAt: '2024-01-01' },
          { category: 'Paper', createdAt: '2024-02-01' },
          { category: 'Fabrics', createdAt: '2024-03-01' },
        ],
        [
          { category: 'books', createdAt: '2025-10-29T10:43:35.075Z' },
          { category: 'clothes', createdAt: '2025-10-29T10:43:49.113Z' },
          { category: 'shoes', createdAt: '2025-10-29T10:44:05.696Z' },
          { category: 'electronics', createdAt: '2025-10-29T10:44:31.115Z' },
        ],
      ),
    ).toEqual([
      'Plastic',
      'Paper',
      'Fabrics',
      'Books',
      'Clothes',
      'Shoes',
      'Electronics',
    ]);
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

describe('material matching is direct (no aliases)', () => {
  it('does not match tyre / drug / hazardous synonyms', () => {
    expect(isMaterialTypeMatch('tires', 'tyre')).toBe(false);
    expect(isMaterialTypeMatch('tire', 'tyres')).toBe(false);
    expect(isMaterialTypeMatch('drugs', 'medication')).toBe(false);
    expect(isMaterialTypeMatch('hazardous', 'biohazard')).toBe(false);
  });

  it('matches only the exact name (case-insensitive)', () => {
    expect(isMaterialTypeMatch('tires', 'tires')).toBe(true);
    expect(isMaterialTypeMatch('Tires', 'tires')).toBe(true);
    expect(isMaterialTypeMatch('tires', 'glass')).toBe(false);
  });
});

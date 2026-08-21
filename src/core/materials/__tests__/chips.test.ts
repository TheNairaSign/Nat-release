import {
  capitalizeChip,
  disposeChipsOrFallback,
  mergeWhereMaterialChips,
} from '@/core/materials';

describe('material chips', () => {
  it('merges primary types ahead of ThingsMatch without duplicates', () => {
    expect(
      mergeWhereMaterialChips(
        ['plastic', { category: 'Food', createdAt: '2024-01-01' }],
        [{ name: 'Plastic' }, 'Fabrics'],
      ),
    ).toEqual(['Food', 'plastic', 'Fabrics']);
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

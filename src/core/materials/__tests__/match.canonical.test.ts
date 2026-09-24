import {
  acceptedCanonicalIds,
  displayMaterials,
  isMaterialTypeMatch,
  locationAcceptsCanonical,
  toCanonicalMaterialId,
} from '../match';
import { mergeWhereMaterialChips, sortMaterialCategories } from '../chips';

describe('material matching (direct names only)', () => {
  it('keeps labels as identity keys — no family remapping', () => {
    expect(toCanonicalMaterialId('Aluminium')).toBe('aluminium');
    expect(toCanonicalMaterialId('Metal')).toBe('metal');
    expect(toCanonicalMaterialId('PET')).toBe('pet');
    expect(toCanonicalMaterialId('Plastic')).toBe('plastic');
    expect(toCanonicalMaterialId('Aluminum Can')).toBe('aluminum can');
    expect(toCanonicalMaterialId('All')).toBeNull();
  });

  it('shows dual-material location under each listed name', () => {
    const loc = {
      primaryMaterialType: 'Metal',
      secondaryMaterialType: 'Plastic',
    };
    expect(locationAcceptsCanonical(loc, 'Plastic')).toBe(true);
    expect(locationAcceptsCanonical(loc, 'Metal')).toBe(true);
    expect(displayMaterials(loc, 'Plastic')).toEqual({ icon: 'Plastic' });
  });

  it('hides metal-only under Plastic', () => {
    const loc = { primaryMaterialType: 'Metal' };
    expect(locationAcceptsCanonical(loc, 'Plastic')).toBe(false);
  });

  it('does not treat Aluminium as Metal', () => {
    expect(
      locationAcceptsCanonical({ primaryMaterialType: 'Aluminium' }, 'Metal'),
    ).toBe(false);
    expect(
      locationAcceptsCanonical(
        { primaryMaterialType: 'Aluminium' },
        'Aluminium',
      ),
    ).toBe(true);
  });

  it('does not invent matches from unrelated subtype lists', () => {
    expect(
      isMaterialTypeMatch('metal', undefined, undefined, undefined, [
        'Aluminum Can',
      ]),
    ).toBe(false);
    expect(
      acceptedCanonicalIds({
        bulkMaterialTypes: [],
      }),
    ).toEqual([]);
  });

  it('sort keeps Aluminium and Metal distinct; merge keeps TM labels', () => {
    expect(
      sortMaterialCategories(['Glass', 'Aluminium', 'Metal', 'Plastic']),
    ).toEqual(['Plastic', 'Aluminium', 'Glass', 'Metal']);
    expect(
      mergeWhereMaterialChips(
        ['Plastic', 'Glass', 'Paper'],
        ['books', 'clothes', 'shoes', 'electronics'],
      ),
    ).toEqual([
      'Books',
      'Clothes',
      'Electronics',
      'Glass',
      'Paper',
      'Plastic',
      'Shoes',
    ]);
  });

  it('does not match tyre / drug / hazardous synonyms', () => {
    expect(isMaterialTypeMatch('tires', 'tyre')).toBe(false);
    expect(isMaterialTypeMatch('drugs', 'medication')).toBe(false);
    expect(isMaterialTypeMatch('hazardous', 'biohazard')).toBe(false);
    expect(isMaterialTypeMatch('tires', 'tires')).toBe(true);
  });

  it('matches materials like Paint by direct name', () => {
    expect(
      locationAcceptsCanonical({ bulkMaterialTypes: ['Paint'] }, 'Paint'),
    ).toBe(true);
    expect(
      locationAcceptsCanonical({ bulkMaterialTypes: ['Paint'] }, 'paint'),
    ).toBe(true);
    expect(
      locationAcceptsCanonical({ bulkMaterialTypes: ['Paint'] }, 'Plastic'),
    ).toBe(false);
    expect(
      isMaterialTypeMatch('Paint', undefined, undefined, ['Paint', 'Glass']),
    ).toBe(true);
  });

  it('does not treat Battery as Electronics', () => {
    expect(
      locationAcceptsCanonical(
        { bulkMaterialTypes: ['electronics', 'plastic'] },
        'Battery',
      ),
    ).toBe(false);
    expect(
      locationAcceptsCanonical({ bulkMaterialTypes: ['Battery'] }, 'Battery'),
    ).toBe(true);
  });
});

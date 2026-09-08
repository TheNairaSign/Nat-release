import {
  acceptedCanonicalIds,
  displayMaterials,
  isMaterialTypeMatch,
  locationAcceptsCanonical,
  toCanonicalMaterialId,
} from '../match';
import { mergeWhereMaterialChips, sortMaterialCategories } from '../chips';

describe('canonical materials (1A + 2A)', () => {
  it('maps aluminium and PET to metal / plastic', () => {
    expect(toCanonicalMaterialId('Aluminium')).toBe('metal');
    expect(toCanonicalMaterialId('PET')).toBe('plastic');
    expect(toCanonicalMaterialId('Aluminum Can')).toBeNull();
  });

  it('shows metal-primary + plastic-secondary under Plastic with plastic icon', () => {
    const loc = {
      primaryMaterialType: 'Metal',
      secondaryMaterialType: 'Plastic',
    };
    expect(locationAcceptsCanonical(loc, 'Plastic')).toBe(true);
    expect(displayMaterials(loc, 'Plastic')).toEqual({ icon: 'Plastic' });
  });

  it('hides metal-only under Plastic', () => {
    const loc = { primaryMaterialType: 'Metal' };
    expect(locationAcceptsCanonical(loc, 'Plastic')).toBe(false);
  });

  it('shows aluminium-primary under Metal chip', () => {
    expect(
      locationAcceptsCanonical({ primaryMaterialType: 'Aluminium' }, 'Metal'),
    ).toBe(true);
  });

  it('does not invent metal from Aluminum Can subtype alone', () => {
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

  it('collapses aluminium into metal on chip row and ignores ThingsMatch merge', () => {
    expect(
      sortMaterialCategories(['Glass', 'Aluminium', 'Metal', 'Plastic']),
    ).toEqual(['Plastic', 'Metal', 'Glass']);
    expect(
      mergeWhereMaterialChips(['Plastic', 'Glass'], ['Furniture', 'Toys']),
    ).toEqual(['Plastic', 'Glass']);
  });

  it('matches tires / drugs / hazardous aliases', () => {
    expect(isMaterialTypeMatch('tires', 'tyre')).toBe(true);
    expect(isMaterialTypeMatch('drugs', 'medication')).toBe(true);
    expect(isMaterialTypeMatch('hazardous', 'biohazard')).toBe(true);
    expect(isMaterialTypeMatch('tires', 'glass')).toBe(false);
  });
});

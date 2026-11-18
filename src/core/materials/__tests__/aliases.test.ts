import {
  clearMaterialAliases,
  fieldMatchesMaterial,
  findMatchingMaterial,
  locationAcceptsCanonical,
  registerMaterialAliases,
} from '@/core/materials';

describe('material aliases (web materialMatch, Nov 18)', () => {
  afterEach(() => clearMaterialAliases());

  it('matches only exact names until URS aliases are known', () => {
    expect(findMatchingMaterial('electronics', ['E-waste'])).toBeNull();
    expect(fieldMatchesMaterial('Electronics', 'E-waste')).toBe(false);
  });

  it('matches an old name to the renamed material, never a family', () => {
    registerMaterialAliases([
      { category: 'e-waste', description: 'electronic waste', aliases: ['electronics', 'ewaste'] },
      { category: 'fabrics', description: 'Textiles', aliases: ['fabric', 'textile'] },
      { category: 'battery', description: 'Batteries', aliases: [] },
    ]);
    expect(findMatchingMaterial('electronics', ['Plastic', 'E-waste'])).toBe('E-waste');
    expect(findMatchingMaterial('textile', ['Fabrics'])).toBe('Fabrics');
    // ThingsMatch's own Electronics chip still matches itself first.
    expect(findMatchingMaterial('electronics', ['E-waste', 'Electronics'])).toBe('Electronics');
    expect(locationAcceptsCanonical({ materialTypes: ['electronics'] }, 'E-waste')).toBe(true);
    expect(fieldMatchesMaterial('Battery', 'E-waste')).toBe(false);
  });
});

import { breakdownIcon } from '../impact';

describe('breakdownIcon', () => {
  // Transcribed from getMaterialIcon in client/src/utils/materialContributions.ts
  it.each([
    ['plastic', 'bottle-water'],
    ['fabric', 'shirt'],
    ['fabrics', 'shirt'],
    ['glass', 'wine-glass'],
    ['mixed', 'recycle'],
    ['organic', 'leaf'],
    ['organics', 'leaf'],
    ['paper', 'file-text'],
    ['books', 'book'],
    ['metal', 'cog'],
    ['metals', 'cog'],
    ['electronics', 'laptop'],
    ['aluminium', 'can'],
    ['aluminum', 'can'],
    ['hazardous', 'biohazard'],
    ['drug', 'capsules'],
    ['drugs', 'capsules'],
  ])('maps %s to %s', (material, icon) => {
    expect(breakdownIcon(material)).toBe(icon);
  });

  it('is case and whitespace insensitive', () => {
    expect(breakdownIcon('  Plastic ')).toBe('bottle-water');
  });

  it('falls back to laptop for anything electronics-like', () => {
    expect(breakdownIcon('old computer parts')).toBe('laptop');
    expect(breakdownIcon('e-waste bin')).toBe('laptop');
  });

  it('falls back to recycle for unknown materials', () => {
    expect(breakdownIcon('unobtanium')).toBe('recycle');
    expect(breakdownIcon('')).toBe('recycle');
  });

  it('uses can (FaBox), not the marker BoxOpen, for aluminium', () => {
    // The breakdown card and the Where marker deliberately use different
    // aluminium glyphs; keep the two tables separate.
    expect(breakdownIcon('aluminium')).toBe('can');
  });
});

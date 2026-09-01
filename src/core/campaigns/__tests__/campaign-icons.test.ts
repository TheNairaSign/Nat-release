import { campaignMaterialIcon, campaignMaterialType } from '../campaigns';

describe('campaignMaterialIcon', () => {
  // Transcribed from getIconForMaterialType in CampaignsPage.tsx:60-107.
  it('maps the four plain material families', () => {
    expect(campaignMaterialIcon('plastic')).toMatchObject({
      name: 'bottle-water',
      color: '#16a34a',
    });
    expect(campaignMaterialIcon('textile')).toMatchObject({
      name: 'checkroom',
      color: '#2563eb',
    });
    expect(campaignMaterialIcon('glass')).toMatchObject({
      name: 'wine-bottle',
      color: '#d97706',
    });
    expect(campaignMaterialIcon('cardboard')).toMatchObject({
      name: 'forest',
      color: '#166534',
    });
  });

  it('puts drugs and hazards on their own coloured disc', () => {
    expect(campaignMaterialIcon('medication')).toMatchObject({
      name: 'capsules',
      badgeBg: '#FF9A9A',
    });
    expect(campaignMaterialIcon('toxic waste')).toMatchObject({
      name: 'biohazard',
      badgeBg: '#F5D74D',
    });
  });

  it('falls back to a green forest glyph', () => {
    expect(campaignMaterialIcon('unobtanium')).toMatchObject({
      name: 'forest',
      color: '#16a34a',
    });
    expect(campaignMaterialIcon('')).toMatchObject({ name: 'forest' });
  });

  it('is a different table from the Where marker engine', () => {
    // Glass is FaGlassWater on the map but FaWineBottle here; paper is FaFile
    // there and MdForest here. Merging the tables would reintroduce drift.
    expect(campaignMaterialIcon('glass').name).toBe('wine-bottle');
    expect(campaignMaterialIcon('paper').name).toBe('forest');
  });
});

describe('campaignMaterialType', () => {
  it('takes the first entry of an array', () => {
    expect(campaignMaterialType(['plastic', 'glass'])).toBe('plastic');
  });

  it('passes a bare string through', () => {
    expect(campaignMaterialType('glass')).toBe('glass');
  });

  it('falls back to "All" when empty or missing', () => {
    expect(campaignMaterialType([])).toBe('All');
    expect(campaignMaterialType(undefined)).toBe('All');
  });
});

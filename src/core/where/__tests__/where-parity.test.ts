import {
  isCampaignShownOnEventsMap,
  markerSpecForPlace,
  registerMaterialVisuals,
  resolveMaterialVisual,
  searchPlaces,
  type WherePlace,
} from '@/core/where';
import { clearMaterialVisuals } from '@/core/where/material-visuals';

const place = (over: Partial<WherePlace>): WherePlace => ({
  kind: 'simple',
  id: 'x',
  name: 'Place',
  lat: 0,
  lng: 0,
  materials: [],
  record: true,
  ...over,
});

describe('search, as web useLocationSearch', () => {
  const near = place({ id: 'near', name: 'Hartford plastic bin', lat: 41.76, lng: -72.67, materials: ['plastic'] });
  const far = place({ id: 'far', name: 'Boston plastic depot', lat: 42.36, lng: -71.06, materials: ['plastic'] });
  const glass = place({ id: 'glass', name: 'Hartford glass bank', lat: 41.77, lng: -72.68, materials: ['glass'] });
  const origin = { latitude: 41.76, longitude: -72.67 };

  it('needs every word, not the whole phrase in one field', () => {
    const found = searchPlaces([near, far, glass], 'plastic hartford', origin);
    expect(found.map((p) => p.id)).toEqual(['near']);
  });

  it('lists matches nearest first', () => {
    expect(searchPlaces([far, near], 'plastic', origin).map((p) => p.id)).toEqual(['near', 'far']);
  });

  it('with no query, lists the closest 40', () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      place({ id: `p${i}`, lat: origin.latitude + i * 0.01, lng: origin.longitude }),
    ).reverse();
    const found = searchPlaces(many, '  ', origin);
    expect(found).toHaveLength(40);
    expect(found[0]?.id).toBe('p0');
  });
});

describe('material visuals, as web materialVisualRegistry', () => {
  afterEach(() => clearMaterialVisuals());

  it("uses URS's own colour and icon for the material", () => {
    registerMaterialVisuals([{ category: 'Organics', iconUrl: 'https://urs/leaf.png', colorHex: '65a30d' }]);
    expect(resolveMaterialVisual('organics')).toEqual({
      iconUrl: 'https://urs/leaf.png',
      colorHex: '#65A30D',
    });
    const spec = markerSpecForPlace(place({ materials: ['organics'] }), { size: 40 });
    expect(spec.iconUrl).toBe('https://urs/leaf.png');
    expect(spec.color.bg).toBe('#65A30D');
  });

  it('falls back to the default colour when URS gives none', () => {
    const spec = markerSpecForPlace(place({ materials: ['fabrics'] }), { size: 40 });
    expect(spec.color.bg).toBe('#8B5CF6');
    expect(spec.iconUrl).toBeNull();
  });

  it('keeps the calendar for events, not a material icon', () => {
    registerMaterialVisuals([{ category: 'plastic', iconUrl: 'https://urs/bottle.png' }]);
    const spec = markerSpecForPlace(place({ kind: 'campaign', materials: ['plastic'], phase: 'live' }), {
      size: 40,
    });
    expect(spec.iconUrl).toBeNull();
    expect(spec.glyph).toBe('CalendarDays');
  });

  it('a pale colour gets a dark glyph so it stays visible', () => {
    registerMaterialVisuals([{ category: 'hazardous', colorHex: '#F5D74D' }]);
    expect(markerSpecForPlace(place({ materials: ['hazardous'] }), { size: 40 }).glyphColor).toBe('#1A1A1A');
  });
});

describe('which events the map shows, as web isCampaignShownOnEventsMap', () => {
  const now = new Date('2026-11-12T12:00:00');

  it('shows live, upcoming and just-ended events', () => {
    expect(isCampaignShownOnEventsMap({ status: 'active', startDate: '2026-11-01', endDate: '2026-11-30' }, now)).toBe(true);
    expect(isCampaignShownOnEventsMap({ status: 'active', startDate: '2026-12-01', endDate: '2026-12-05' }, now)).toBe(true);
    expect(isCampaignShownOnEventsMap({ status: 'active', startDate: '2026-11-01', endDate: '2026-11-10' }, now)).toBe(true);
  });

  it('drops events ended over three days ago, hidden or cancelled', () => {
    expect(isCampaignShownOnEventsMap({ status: 'active', startDate: '2026-10-01', endDate: '2026-11-01' }, now)).toBe(false);
    expect(isCampaignShownOnEventsMap({ status: 'active', isHidden: true }, now)).toBe(false);
    expect(isCampaignShownOnEventsMap({ status: 'cancelled' }, now)).toBe(false);
  });
});

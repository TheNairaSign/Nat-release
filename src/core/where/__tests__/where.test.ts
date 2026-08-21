import { findMatchingMaterial, isMaterialTypeMatch } from '@/core/materials';
import { createDropoffHref, eventsLabel, filterPlaces } from '@/core/where';

describe('where hrefs and filters', () => {
  it('builds Record query strings from main', () => {
    expect(createDropoffHref({ type: 'Food' })).toBe(
      '/dropoff/create?type=Food',
    );
    expect(
      createDropoffHref({
        type: 'plastic',
        mode: 'simple',
        locationId: 'loc-1',
      }),
    ).toBe('/dropoff/create?type=plastic&mode=simple&locationId=loc-1');
  });

  it('labels event counts', () => {
    expect(eventsLabel(0)).toBe('No events');
    expect(eventsLabel(1)).toBe('1 event');
    expect(eventsLabel(3)).toBe('3 events');
  });

  it('filters static vs simple places', () => {
    const places = [
      {
        kind: 'regular' as const,
        id: 'a',
        name: 'Center',
        lat: 0,
        lng: 0,
        materials: ['plastic'],
        record: true,
      },
      {
        kind: 'simple' as const,
        id: 'b',
        name: 'Bin',
        lat: 0,
        lng: 0,
        materials: ['Food'],
        record: true,
      },
    ];
    expect(
      filterPlaces(places, {
        organization: null,
        platform: 'simple',
        focus: 'points',
      }),
    ).toEqual([places[1]]);
  });
});

describe('material matching for Where chips', () => {
  it('matches Food query to the Food chip', () => {
    expect(findMatchingMaterial('Food', ['plastic', 'Food', 'Fabrics'])).toBe(
      'Food',
    );
  });

  it('matches PET under plastic', () => {
    expect(isMaterialTypeMatch('plastic', 'PET')).toBe(true);
  });
});

import { findMatchingMaterial, isMaterialTypeMatch } from '@/core/materials';
import {
  createDropoffHref,
  eventsLabel,
  filterPlaces,
  searchMaterialTypes,
  searchOrganizations,
  searchTypeLabel,
  type WherePlace,
} from '@/core/where';

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

describe('searchTypeLabel', () => {
  const place = (over: Partial<WherePlace>): WherePlace => ({
    kind: 'regular',
    id: 'x',
    name: 'Site',
    lat: 0,
    lng: 0,
    materials: [],
    record: false,
    ...over,
  });

  it('never leaks the raw kind enum into the UI', () => {
    // Regression: results used to render "regular" / "simple" / "campaign".
    for (const kind of ['regular', 'simple', 'campaign'] as const) {
      expect(searchTypeLabel(place({ kind }))).not.toBe(kind);
    }
  });

  it('labels regular centres and campaign events', () => {
    expect(searchTypeLabel(place({ kind: 'regular' }))).toBe('Center');
    expect(searchTypeLabel(place({ kind: 'campaign' }))).toBe('Event');
  });

  it('prefers a simple drop-off display tag, falling back to "Drop-off"', () => {
    expect(searchTypeLabel(place({ kind: 'simple', tag: 'Bin' }))).toBe('Bin');
    expect(searchTypeLabel(place({ kind: 'simple' }))).toBe('Drop-off');
    expect(searchTypeLabel(place({ kind: 'simple', tag: '   ' }))).toBe(
      'Drop-off',
    );
  });
});

describe('searchOrganizations', () => {
  const at = (org: string | undefined, id: string): WherePlace => ({
    kind: 'simple',
    id,
    name: id,
    lat: 0,
    lng: 0,
    materials: [],
    record: false,
    organizationName: org,
  });

  it('returns nothing for an empty query, as web does', () => {
    expect(searchOrganizations([at('Acme', 'a')], '  ')).toEqual([]);
  });

  it('counts how many places each organisation owns', () => {
    const rows = searchOrganizations(
      [at('Acme', 'a'), at('Acme', 'b'), at('Beta', 'c')],
      'a',
    );
    const acme = rows.find((r) => r.name === 'Acme');
    expect(acme?.locationCount).toBe(2);
  });

  it('ignores places with no organisation', () => {
    expect(searchOrganizations([at(undefined, 'a')], 'a')).toEqual([]);
  });

  it('matches case-insensitively on a substring', () => {
    expect(searchOrganizations([at('Acme', 'a')], 'CM')).toHaveLength(1);
  });
});

describe('searchMaterialTypes', () => {
  it('returns nothing for an empty query', () => {
    expect(searchMaterialTypes(['Plastic'], '')).toEqual([]);
  });

  it('filters case-insensitively', () => {
    expect(searchMaterialTypes(['Plastic', 'Glass'], 'las')).toEqual([
      'Plastic',
      'Glass',
    ]);
  });
});

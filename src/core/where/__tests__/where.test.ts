import { findMatchingMaterial, isMaterialTypeMatch } from '@/core/materials';
import {
  createDropoffHref,
  eventsLabel,
  formatDistance,
  isCoveredPosition,
  nearEventsCount,
  filterPlaces,
  searchMaterialTypes,
  searchOrganizations,
  searchTypeLabel,
  type WherePlace,
  getCampaignPhase,
  wherePins,
  type WhereBranch,
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

  it('labels event counts as near you, as web does', () => {
    expect(eventsLabel(0)).toBe('No events close to you');
    expect(eventsLabel(1)).toBe('1 event near you');
    expect(eventsLabel(3)).toBe('3 events near you');
  });

  it('counts only events within 15 miles once it knows where they are', () => {
    const here = { latitude: 41.31, longitude: -72.92 }; // New Haven
    const places = [
      { kind: 'campaign', lat: 41.3, lng: -72.9 }, // in town
      { kind: 'campaign', lat: 42.36, lng: -71.06 }, // Boston
      { kind: 'simple', lat: 41.3, lng: -72.9 },
    ];
    expect(nearEventsCount(places, here)).toBe(1);
    expect(nearEventsCount(places, null)).toBe(2);
  });

  it('shows distances in miles', () => {
    expect(formatDistance(1.609344)).toBe('1.0 mi');
    expect(formatDistance(32.18688)).toBe('20 mi');
    expect(formatDistance(0.05)).toBe('160 ft');
  });

  it('knows the mapped states', () => {
    expect(isCoveredPosition({ latitude: 41.31, longitude: -72.92 })).toBe(true);
    expect(isCoveredPosition({ latitude: 6.52, longitude: 3.38 })).toBe(false);
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

  it('does not match PET under plastic', () => {
    expect(isMaterialTypeMatch('plastic', 'PET')).toBe(false);
    expect(isMaterialTypeMatch('PET', 'PET')).toBe(true);
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

describe('campaign day keys (timezone)', () => {
  // Ported from web 6db3a29 "Fix campaign date timezone shift".
  // `toISOString()` converts to UTC first, so west of Greenwich a campaign
  // dated Sep 9 was keyed as Sep 8 and could read as ended a day early.
  //
  // These assertions are built from *local* date parts so they hold in any
  // timezone the suite runs in.
  const localDayString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;

  it('keeps an event live all through its end day, late in the evening', () => {
    // A date-only endDate parses as midnight UTC; comparing instants marked
    // a same-day event as ended from 01:00 local in Lagos. Fixed in both
    // mobile and client/src/utils/campaignUtils.ts.
    const now = new Date(2026, 8, 9, 23, 30, 0);
    const today = localDayString(now);
    expect(getCampaignPhase({ startDate: today, endDate: today }, now)).toBe(
      'live',
    );
  });

  it('treats a campaign dated today as live, early in the morning', () => {
    // 00:30 local is the case that flipped to the previous UTC day.
    const now = new Date(2026, 8, 9, 0, 30, 0);
    const today = localDayString(now);
    expect(
      getCampaignPhase({ startDate: today, endDate: today }, now),
    ).toBe('live');
  });

  it('still reports a genuinely finished campaign as ended', () => {
    const now = new Date(2026, 8, 9, 12, 0, 0);
    expect(
      getCampaignPhase({ startDate: '2026-09-01', endDate: '2026-09-02' }, now),
    ).toBe('ended');
  });
});

describe('wherePins', () => {
  const site = (over: Partial<WherePlace>): WherePlace => ({
    kind: 'simple',
    id: 's1',
    name: 'Hub',
    lat: 4.8,
    lng: 7.0,
    materials: ['plastic'],
    record: true,
    ...over,
  });
  const branch = (over: Partial<WhereBranch> = {}): WhereBranch => ({
    name: 'Branch',
    lat: 4.9,
    lng: 7.1,
    isActive: true,
    ...over,
  });

  it('draws a pin for the site and one for every branch', () => {
    // Regression: mobile drew only the main site — 39 pins where web drew 304
    // against production data around Port Harcourt.
    const pins = wherePins([
      site({ extraLocations: [branch(), branch(), branch()] }),
    ]);
    expect(pins).toHaveLength(4);
    expect(pins.map((p) => p.branchIndex)).toEqual([null, 0, 1, 2]);
  });

  it('places each branch pin at the branch, not the parent', () => {
    const [, first] = wherePins([
      site({ extraLocations: [branch({ lat: 5.5, lng: 8.5 })] }),
    ]);
    expect(first).toMatchObject({ lat: 5.5, lng: 8.5 });
  });

  it('gives every pin a unique key', () => {
    const pins = wherePins([
      site({ id: 'a', extraLocations: [branch(), branch()] }),
      site({ id: 'b', extraLocations: [branch()] }),
    ]);
    expect(new Set(pins.map((p) => p.key)).size).toBe(pins.length);
  });

  it('greys a branch when either it or its parent is inactive', () => {
    const pins = wherePins([
      site({ extraLocations: [branch({ isActive: false }), branch()] }),
      site({ id: 'off', isActive: false, extraLocations: [branch()] }),
    ]);
    expect(pins.find((p) => p.key === 's1::0')?.inactive).toBe(true);
    expect(pins.find((p) => p.key === 's1::1')?.inactive).toBe(false);
    expect(pins.find((p) => p.key === 'off::0')?.inactive).toBe(true);
  });

  it('leaves places without branches as a single pin', () => {
    expect(wherePins([site({ extraLocations: undefined })])).toHaveLength(1);
  });
});

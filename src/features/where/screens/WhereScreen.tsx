import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PENDING_DROPOFF_KEY } from '@/core/dropoff';
import { findMatchingMaterial } from '@/core/materials';
import {
  DEFAULT_MAP_CENTER,
  createDropoffHref,
  directionsUrl,
  filterPlaces,
  markerSizeForZoom,
  markerSpecForPlace,
  pickPlaceById,
  recordMaterialType,
  searchMaterialTypes,
  searchOrganizations,
  searchPlaces,
  type MapPanelFocus,
  type WhereFilterId,
  type WherePlace,
} from '@/core/where';
import {
  fetchMapPartners,
  fetchWhereChips,
  fetchWherePlaces,
  sendCampaignReminder,
  whereChipsQueryKey,
  wherePartnersQueryKey,
  wherePlacesQueryKey,
} from '../api/where-api';
import { FilterMenu } from '../ui/FilterMenu';
import { LocationSheet } from '../ui/LocationSheet';
import { MapMarkerPin } from '../ui/MapMarkerPin';
import { MapTopPanel } from '../ui/MapTopPanel';
import { useQuery } from '@/shared/api';
import { MAP_DATA_ACCURACY_URL } from '@/shared/config/legalUrls';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen } from '@/shared/ui';
import { WhereMap } from '@/shared/ui/maps/WhereMap';

export type WhereSignInIntent = 'record' | 'reminder';

export function WhereScreen({
  guest = false,
  type,
  organization,
  locationId,
  onRequireSignIn,
}: {
  guest?: boolean;
  type?: string;
  organization?: string;
  locationId?: string;
  onRequireSignIn?: (intent?: WhereSignInIntent) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { http, navigation, location, linking, kv } = usePorts();
  const [focus, setFocus] = useState<MapPanelFocus>('points');
  const [materialOverride, setMaterialOverride] = useState<
    string | null | undefined
  >(undefined);
  const [platform, setPlatform] = useState<WhereFilterId>('all');
  const [orgOverride, setOrgOverride] = useState<string | null | undefined>(
    undefined,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [branchFocus, setBranchFocus] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [picked, setPicked] = useState<WherePlace | null | undefined>(
    undefined,
  );
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number }>(
    {
      latitude: DEFAULT_MAP_CENTER.latitude,
      longitude: DEFAULT_MAP_CENTER.longitude,
    },
  );
  const [hasGps, setHasGps] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [reminderPending, setReminderPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await location.requestPermission();
      const position = await location.getCurrentPosition();
      if (cancelled) return;
      if (position) {
        setOrigin(position);
        setHasGps(true);
        setZoom(14);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location]);

  const chipsQuery = useQuery({
    queryKey: whereChipsQueryKey,
    queryFn: () => fetchWhereChips(http),
  });
  const selectedMaterial =
    materialOverride === undefined
      ? chipsQuery.data && type
        ? findMatchingMaterial(type, chipsQuery.data)
        : null
      : materialOverride;
  const orgFilter =
    orgOverride === undefined ? (organization ?? null) : orgOverride;

  const placesQuery = useQuery({
    queryKey: [...wherePlacesQueryKey, origin, selectedMaterial],
    queryFn: () =>
      fetchWherePlaces(http, origin, selectedMaterial ?? undefined),
  });
  const partnersQuery = useQuery({
    queryKey: wherePartnersQueryKey,
    queryFn: () => fetchMapPartners(http),
  });

  const selected =
    picked === undefined
      ? pickPlaceById(placesQuery.data ?? [], locationId)
      : picked;
  const panelFocus = selected?.kind === 'campaign' ? 'events' : focus;
  const visible = useMemo(() => {
    // Search runs across every loaded place, not the filtered subset. Web's
    // useLocationSearch searches `searchableData` (all of it), so scoping the
    // query to the active platform/focus here meant a search from the Points
    // card could never return an event — "it doesn't show all the results".
    if (searchOpen) return searchPlaces(placesQuery.data ?? [], searchQuery);
    return filterPlaces(placesQuery.data ?? [], {
      organization: orgFilter,
      platform,
      focus: panelFocus,
    });
  }, [
    placesQuery.data,
    orgFilter,
    platform,
    panelFocus,
    searchOpen,
    searchQuery,
  ]);

  // Web's useLocationSearch groups organisations and material types above the
  // location results; both are derived client-side from data already loaded.
  const orgResults = useMemo(
    () =>
      searchOpen
        ? searchOrganizations(placesQuery.data ?? [], searchQuery)
        : [],
    [searchOpen, placesQuery.data, searchQuery],
  );
  const materialResults = useMemo(
    () =>
      searchOpen ? searchMaterialTypes(chipsQuery.data ?? [], searchQuery) : [],
    [searchOpen, chipsQuery.data, searchQuery],
  );
  const eventCount = (placesQuery.data ?? []).filter(
    (place) => place.kind === 'campaign',
  ).length;
  // Any change of selected place clears the branch focus, so the camera never
  // stays parked on a branch of a place the user has moved away from.
  const pick = useCallback((place: WherePlace | null) => {
    setPicked(place);
    setBranchFocus(null);
  }, []);

  const camera = useMemo(() => {
    // A branch chosen inside the location sheet wins over the place itself,
    // matching web's handleSimpleMarkerClick(id, extraLocationIndex).
    if (branchFocus) {
      return { latitude: branchFocus.lat, longitude: branchFocus.lng };
    }
    return selected
      ? { latitude: selected.lat, longitude: selected.lng }
      : origin;
  }, [branchFocus, selected, origin]);
  const cameraZoom = selected ? 16 : zoom;

  async function onRecord(place: WherePlace) {
    const href =
      place.kind === 'simple'
        ? createDropoffHref({
            type: recordMaterialType(place),
            mode: 'simple',
            locationId: place.id,
          })
        : createDropoffHref({ type: recordMaterialType(place) });
    if (guest) {
      await kv.set(PENDING_DROPOFF_KEY, href);
      onRequireSignIn?.('record');
      return;
    }
    navigation.navigate(href);
  }

  function onDirections(place: WherePlace) {
    const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
    void linking.openUrl(
      directionsUrl(platformKey, place.lat, place.lng, place.name),
    );
  }

  async function onReminder(place: WherePlace) {
    if (guest) {
      onRequireSignIn?.('reminder');
      return;
    }
    setReminderPending(true);
    try {
      await sendCampaignReminder(http, place.id);
    } finally {
      setReminderPending(false);
    }
  }

  return (
    <ChromeScreen bleed>
      <View style={{ flex: 1, backgroundColor: theme.color.mapCanvas }}>
        <WhereMap
          center={camera}
          zoom={cameraZoom}
          showsUser={hasGps}
          markers={visible.map((place) => ({
            id: place.id,
            lat: place.lat,
            lng: place.lng,
            selected: selected?.id === place.id,
          }))}
          onMarkerPress={(id) => {
            const match = visible.find((place) => place.id === id);
            if (match) pick(match);
          }}
        >
          {(marker) => {
            const place = visible.find((item) => item.id === marker.id);
            if (!place) return null;
            return (
              <MapMarkerPin
                spec={markerSpecForPlace(place, {
                  size: markerSizeForZoom(cameraZoom, marker.selected),
                  isHighlighted: marker.selected,
                })}
              />
            );
          }}
        </WhereMap>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: Math.max(8, insets.top),
            paddingHorizontal: 12,
          }}
        >
          <MapTopPanel
            focus={panelFocus}
            organization={orgFilter}
            origin={origin}
            onFocus={(next) => {
              setFocus(next);
              pick(null);
            }}
            chips={chipsQuery.data ?? []}
            chipsLoading={chipsQuery.isPending}
            selectedMaterial={selectedMaterial}
            onSelectMaterial={(material) => {
              setMaterialOverride(material);
              pick(null);
              if (material) setPlatform('all');
            }}
            searchOpen={searchOpen}
            onOpenSearch={() => {
              setSearchOpen(true);
              setFilterOpen(false);
              setFocus('points');
            }}
            onCloseSearch={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
            searchQuery={searchQuery}
            onSearchQuery={setSearchQuery}
            searchResults={visible}
            searchOrganizations={orgResults}
            onSelectOrganization={(name) => {
              setOrgOverride(name);
              pick(null);
              setSearchOpen(false);
              setSearchQuery('');
            }}
            searchMaterialTypes={materialResults}
            onSelectPlace={(place) => {
              pick(place);
              // Search spans every kind, so follow the result onto the card it
              // belongs to; otherwise picking an event from the Points card
              // leaves the panel showing the wrong context.
              setFocus(place.kind === 'campaign' ? 'events' : 'points');
              setSearchOpen(false);
              setSearchQuery('');
            }}
            filterOpen={filterOpen}
            onToggleFilter={() => setFilterOpen((open) => !open)}
            hasActiveFilters={platform !== 'all' || Boolean(orgFilter)}
            eventsCount={eventCount}
            eventsReady={!placesQuery.isPending}
          />
        </View>
        {selected ? (
          <View
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: theme.layout.tabBarReserve + insets.bottom - 24,
            }}
          >
            <LocationSheet
              place={selected}
              reminderPending={reminderPending}
              onClose={() => pick(null)}
              onFocusBranch={setBranchFocus}
              onRecord={() => {
                void onRecord(selected);
              }}
              onDirections={() => onDirections(selected)}
              onReminder={() => {
                void onReminder(selected);
              }}
            />
          </View>
        ) : null}
        {!selected ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Map and data accuracy disclaimer"
            onPress={() => {
              void linking.openUrl(MAP_DATA_ACCURACY_URL);
            }}
            style={{
              position: 'absolute',
              left: 12,
              bottom: theme.layout.tabBarReserve + insets.bottom + 8,
              maxWidth: '52%',
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.06)',
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 10,
                fontFamily: theme.font.medium,
                color: theme.color.textMuted,
              }}
            >
              Map & data accuracy
            </Text>
          </Pressable>
        ) : null}
        <FilterMenu
          open={filterOpen}
          selected={platform}
          organization={orgFilter}
          partners={partnersQuery.data ?? []}
          onClose={() => setFilterOpen(false)}
          onSelect={(id) => {
            setPlatform(id);
            if (id === 'mobile') {
              setFocus('events');
              pick(null);
            } else {
              setFocus('points');
            }
          }}
          onSelectOrganization={(name) => {
            setOrgOverride(name);
            pick(null);
          }}
        />
      </View>
    </ChromeScreen>
  );
}

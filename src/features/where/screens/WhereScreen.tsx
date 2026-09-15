import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PENDING_DROPOFF_KEY } from '@/core/dropoff';
import { findMatchingMaterial } from '@/core/materials';
import {
  DEFAULT_MAP_CENTER,
  createDropoffHref,
  directionsUrl,
  filterPlaces,
  haversineKm,
  markerSizeForZoom,
  markerSpecForPlace,
  pickPlaceById,
  recordMaterialType,
  searchMaterialTypes,
  searchOrganizations,
  searchPlaces,
  wherePins,
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
  /** One-shot fly-to-closest after homepage/chip material select. */
  const [materialFocus, setMaterialFocus] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const materialFocusKeyRef = useRef<string | null>(null);

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
  const [pickedBranch, setPickedBranch] = useState<number | null>(null);

  const pick = useCallback((place: WherePlace | null) => {
    setPicked(place);
    setBranchFocus(null);
    setPickedBranch(null);
    if (place) setMaterialFocus(null);
  }, []);

  // Tapping a branch pin opens its parent with that branch selected — web's
  // handleSimpleMarkerClick(location.id, extraLocationIndex).
  const pickBranch = useCallback((place: WherePlace, index: number) => {
    const branch = place.extraLocations?.[index];
    setPicked(place);
    setPickedBranch(index);
    setBranchFocus(branch ? { lat: branch.lat, lng: branch.lng } : null);
    setMaterialFocus(null);
  }, []);

  // Homepage Find Where / chip select: zoom to nearest matching place once.
  useEffect(() => {
    if (!selectedMaterial) {
      materialFocusKeyRef.current = null;
      setMaterialFocus(null);
      return;
    }
    if (placesQuery.isPending || !placesQuery.data?.length) return;
    if (picked !== undefined && picked !== null) return;

    const focusKey = `${selectedMaterial}|${origin.latitude.toFixed(3)}|${origin.longitude.toFixed(3)}`;
    if (materialFocusKeyRef.current === focusKey) return;

    const nearest = [...placesQuery.data].sort(
      (a, b) =>
        haversineKm(origin.latitude, origin.longitude, a.lat, a.lng) -
        haversineKm(origin.latitude, origin.longitude, b.lat, b.lng),
    )[0];
    if (!nearest) return;

    materialFocusKeyRef.current = focusKey;
    setMaterialFocus({ lat: nearest.lat, lng: nearest.lng });
    setZoom(14);
  }, [
    selectedMaterial,
    placesQuery.isPending,
    placesQuery.data,
    origin.latitude,
    origin.longitude,
    picked,
  ]);

  const pins = useMemo(() => wherePins(visible), [visible]);
  const pinByKey = useMemo(
    () => new Map(pins.map((pin) => [pin.key, pin])),
    [pins],
  );
  const placeById = useMemo(
    () => new Map(visible.map((place) => [place.id, place])),
    [visible],
  );

  const camera = useMemo(() => {
    // A branch chosen inside the location sheet wins over the place itself,
    // matching web's handleSimpleMarkerClick(id, extraLocationIndex).
    if (branchFocus) {
      return { latitude: branchFocus.lat, longitude: branchFocus.lng };
    }
    if (selected) {
      return { latitude: selected.lat, longitude: selected.lng };
    }
    if (materialFocus) {
      return { latitude: materialFocus.lat, longitude: materialFocus.lng };
    }
    return origin;
  }, [branchFocus, selected, materialFocus, origin]);
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
          markers={pins.map((pin) => ({
            id: pin.key,
            lat: pin.lat,
            lng: pin.lng,
            selected:
              selected?.id === pin.placeId &&
              (pickedBranch ?? null) === pin.branchIndex,
          }))}
          onMarkerPress={(key) => {
            const pin = pinByKey.get(key);
            const place = pin ? placeById.get(pin.placeId) : undefined;
            if (!pin || !place) return;
            if (pin.branchIndex === null) pick(place);
            else pickBranch(place, pin.branchIndex);
          }}
        >
          {(marker) => {
            const pin = pinByKey.get(marker.id);
            const place = pin ? placeById.get(pin.placeId) : undefined;
            if (!pin || !place) return null;
            return (
              <MapMarkerPin
                spec={markerSpecForPlace(
                  // A branch borrows its parent's material and platform but
                  // carries its own availability.
                  { ...place, isActive: !pin.inactive },
                  {
                    size: markerSizeForZoom(cameraZoom, marker.selected),
                    isHighlighted: marker.selected,
                  },
                )}
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
              materialFocusKeyRef.current = null;
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
              key={`${selected.id}:${pickedBranch ?? 'main'}`}
              initialBranchIndex={pickedBranch}
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

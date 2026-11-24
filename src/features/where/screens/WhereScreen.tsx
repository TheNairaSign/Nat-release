import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PENDING_DROPOFF_KEY } from '@/core/dropoff';
import { findMatchingMaterial } from '@/core/materials';
import {
  DEFAULT_MAP_CENTER,
  DOT_MARKER_MAX_ZOOM,
  createDropoffHref,
  directionsUrl,
  filterPlaces,
  haversineKm,
  isCoveredPosition,
  markerSizeForZoom,
  nearEventsCount,
  nearEventsFrame,
  markerSpecForPlace,
  pinIconSizeExpression,
  pinImageKey,
  pinMaxSize,
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
import {
  fetchSavedPlaces,
  savePlace,
  savedKey,
  savedPlacesQueryKey,
  unsavePlace,
  type PlaceTargetType,
} from '../api/saved-api';
import { FilterMenu } from '../ui/FilterMenu';
import { LocationSheet } from '../ui/LocationSheet';
import { MapMarkerPin } from '../ui/MapMarkerPin';
import { MapTopPanel } from '../ui/MapTopPanel';
import { WhereCoverageNotice } from '../ui/WhereCoverageNotice';
import { useQuery, useQueryClient } from '@/shared/api';
import { MAP_DATA_ACCURACY_URL } from '@/shared/config/legalUrls';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen } from '@/shared/ui';
import { LocateGlyph } from '@/shared/ui/icons/locateGlyph';
import { WhereMap } from '@/shared/ui/maps/WhereMap';

export type WhereSignInIntent = 'record' | 'reminder';

/**
 * Phone pins are this share of web's size: 1.2 makes 45pt at street zoom 54pt, half as
 * big again as the 0.8 they were (Nov 16 meeting: pins about 50% bigger).
 */
const PIN_SCALE = 1.2;

/**
 * Pins drawn by the map itself, so they don't trail it as you pan (Nov 16 meeting). The
 * web build of this screen has no native map layers and keeps the view markers.
 */
const NATIVE_PINS = Platform.OS !== 'web';

export function WhereScreen({
  guest = false,
  type,
  organization,
  locationId,
  initialFocus,
  eventId,
  onRequireSignIn,
}: {
  guest?: boolean;
  type?: string;
  organization?: string;
  locationId?: string;
  /** `?focus=events`: open on the events card ("View on map" from Events). */
  initialFocus?: string;
  /** `?eventId=`: open that event's card, as if its marker had been tapped. */
  eventId?: string;
  onRequireSignIn?: (intent?: WhereSignInIntent) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { http, navigation, location, linking, kv } = usePorts();
  const [focus, setFocus] = useState<MapPanelFocus>(
    initialFocus === 'events' || eventId ? 'events' : 'points',
  );
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
  /** The zoom as the person pinches (markers turn to dots when far out). */
  const [liveZoom, setLiveZoom] = useState(12);
  const [reminderPending, setReminderPending] = useState(false);
  const [flyTo, setFlyTo] = useState<{
    key: number;
    latitude: number;
    longitude: number;
    zoom: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
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
  // My Places: what's already hearted, so a card's heart starts filled in.
  const queryClient = useQueryClient();
  const savedQuery = useQuery({
    queryKey: savedPlacesQueryKey,
    queryFn: () => fetchSavedPlaces(http),
    enabled: !guest,
  });
  const savedKeys = useMemo(
    () => new Set((savedQuery.data ?? []).map((row) => savedKey(row.targetType, row.targetId))),
    [savedQuery.data],
  );
  /** Flips straight away; the saved list is refetched to settle it. */
  const [savedOverride, setSavedOverride] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const isSaved = (type: PlaceTargetType, id: string) => {
    const key = savedKey(type, id);
    return savedOverride[key] ?? savedKeys.has(key);
  };
  async function toggleSaved(place: WherePlace) {
    const type: PlaceTargetType = place.kind === 'campaign' ? 'campaign' : 'location';
    const key = savedKey(type, place.id);
    const next = !isSaved(type, place.id);
    setSavedOverride((prev) => ({ ...prev, [key]: next }));
    setSavingKey(key);
    try {
      if (next) await savePlace(http, { targetType: type, targetId: place.id, targetName: place.name });
      else await unsavePlace(http, type, place.id);
      await queryClient.invalidateQueries({ queryKey: savedPlacesQueryKey });
    } catch {
      setSavedOverride((prev) => ({ ...prev, [key]: !next }));
    } finally {
      setSavingKey(null);
    }
  }

  const selected =
    picked === undefined
      ? pickPlaceById(placesQuery.data ?? [], locationId ?? eventId)
      : picked;
  const panelFocus = selected?.kind === 'campaign' ? 'events' : focus;
  const visible = useMemo(() => {
    // Search runs across every loaded place, not the filtered subset. Web's
    // useLocationSearch searches `searchableData` (all of it), so scoping the
    // query to the active platform/focus here meant a search from the Points
    // card could never return an event — "it doesn't show all the results".
    if (searchOpen) return searchPlaces(placesQuery.data ?? [], searchQuery, hasGps ? origin : null);
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
    hasGps,
    origin,
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
  // Counted within 15 miles of the person (web nearEventsCount). With a material picked,
  // an ended event can't take it, so it isn't counted (web campaignTakesMaterial, Nov 18).
  const eventCount = nearEventsCount(
    selectedMaterial
      ? (placesQuery.data ?? []).filter((p) => p.kind !== 'campaign' || p.phase !== 'ended')
      : (placesQuery.data ?? []),
    hasGps ? origin : null,
  );
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
      // Only the key is cleared here. Calling setMaterialFocus(null) in the
      // effect body triggers a cascading render (react-hooks/set-state-in-effect);
      // the camera below already ignores a stale focus once the material is
      // deselected, so the extra render bought nothing.
      materialFocusKeyRef.current = null;
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
    // One-shot camera sync, guarded by `focusKey` above so it runs once per
    // material/origin pair rather than on every refetch. Deriving it with
    // useMemo instead would re-fly the camera to the nearest match every time
    // the location sheet is closed, which is not what web does.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // Deselecting the material drops back to the user's own position rather
    // than leaving the camera parked on the last matching place.
    if (selectedMaterial && materialFocus) {
      return { latitude: materialFocus.lat, longitude: materialFocus.lng };
    }
    return origin;
  }, [branchFocus, selected, selectedMaterial, materialFocus, origin]);
  const cameraZoom = selected ? 16 : zoom;
  // The events card frames the events within 15 miles, leaving room for the card over
  // the top and the tab bar at the foot (web centerOnCampaigns, phone padding).
  const eventsFrame = useMemo(() => {
    if (panelFocus !== 'events' || selected || !hasGps) return null;
    const box = nearEventsFrame(placesQuery.data ?? [], origin);
    return box ? { ...box, padding: { top: 240, bottom: 110, left: 48, right: 48 } } : null;
  }, [panelFocus, selected, hasGps, placesQuery.data, origin]);

  /** The locate button: ask (if needed), find them, fly the map back to where they are. */
  async function onLocate() {
    setLocating(true);
    try {
      const allowed = await location.requestPermission();
      const position = allowed ? await location.getCurrentPosition() : null;
      if (!position) return;
      setOrigin(position);
      setHasGps(true);
      pick(null);
      setMaterialFocus(null);
      setZoom(14);
      setFlyTo({ key: Date.now(), ...position, zoom: 14 });
    } finally {
      setLocating(false);
    }
  }

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
    // A chosen branch (or an event's other location) has its own spot, as on web.
    const target = branchFocus ?? { lat: place.lat, lng: place.lng };
    void linking.openUrl(
      directionsUrl(platformKey, target.lat, target.lng, place.name),
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

  // Each pin's look, drawn once per distinct look at its largest size; the map scales it.
  const pinLayerData = useMemo(() => {
    const images = new Map<string, ReturnType<typeof markerSpecForPlace>>();
    const markers = pins.flatMap((pin) => {
      const place = placeById.get(pin.placeId);
      if (!place) return [];
      const isSelected =
        selected?.id === pin.placeId && (pickedBranch ?? null) === pin.branchIndex;
      const spec = markerSpecForPlace(
        { ...place, isActive: !pin.inactive },
        { size: pinMaxSize(isSelected, PIN_SCALE), isHighlighted: isSelected },
      );
      const icon = pinImageKey(spec);
      images.set(icon, spec);
      return [{ id: pin.key, lat: pin.lat, lng: pin.lng, selected: isSelected, icon }];
    });
    return {
      markers,
      layer: {
        images: [...images].map(([name, spec]) => ({ name, spec })),
        iconSize: pinIconSizeExpression(false, PIN_SCALE),
        selectedIconSize: pinIconSizeExpression(true, PIN_SCALE),
        dotMaxZoom: DOT_MARKER_MAX_ZOOM,
      },
    };
  }, [pins, placeById, selected?.id, pickedBranch]);

  return (
    <ChromeScreen bleed>
      <View style={{ flex: 1, backgroundColor: theme.color.mapCanvas }}>
        <WhereMap
          center={camera}
          zoom={cameraZoom}
          frame={eventsFrame}
          flyTo={flyTo}
          onZoomChange={(z) => setLiveZoom((prev) => (Math.abs(prev - z) >= 0.1 ? z : prev))}
          showsUser={hasGps}
          markers={pinLayerData.markers}
          pinLayer={NATIVE_PINS ? pinLayerData.layer : null}
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
            // Far out, several states in view: a small dot until they zoom in.
            if (liveZoom < DOT_MARKER_MAX_ZOOM && !marker.selected) {
              return (
                <View
                  testID={`where-dot-${marker.id}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: '#ffffff',
                    backgroundColor: '#1F5D20',
                  }}
                />
              );
            }
            return (
              <MapMarkerPin
                spec={markerSpecForPlace(
                  // A branch borrows its parent's material and platform but
                  // carries its own availability.
                  { ...place, isActive: !pin.inactive },
                  {
                    // The live zoom, as web does: sizing from the camera's requested
                    // zoom (14, or 16 with a place open) kept every pin full-size as you
                    // pinched out, so they piled into one big mass. Phones also get
                    // smaller pins than web's desktop-tuned 45pt.
                    size: Math.round(markerSizeForZoom(liveZoom, marker.selected) * PIN_SCALE),
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
            onShowMaterialEvents={() => {
              setFocus('events');
              pick(null);
            }}
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
              guest={guest}
              onRequireSignIn={() => onRequireSignIn?.('reminder')}
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
              saved={isSaved(selected.kind === 'campaign' ? 'campaign' : 'location', selected.id)}
              savingSaved={
                savingKey ===
                savedKey(selected.kind === 'campaign' ? 'campaign' : 'location', selected.id)
              }
              onToggleSave={() => void toggleSaved(selected)}
            />
          </View>
        ) : null}
        {!selected ? (
          <Pressable
            testID="where-locate"
            accessibilityRole="button"
            accessibilityLabel="Show my location"
            disabled={locating}
            onPress={() => void onLocate()}
            style={{
              position: 'absolute',
              right: 12,
              bottom: theme.layout.tabBarReserve + insets.bottom + 4,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.08)',
              opacity: locating ? 0.6 : 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <LocateGlyph color={hasGps ? '#1A73E8' : '#475569'} size={22} />
          </Pressable>
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
        {/* Outside the mapped states: say why the map looks empty, once a visit. Not
            when they came for a particular place or event. */}
        {hasGps && !isCoveredPosition(origin) && !locationId && !eventId ? (
          <WhereCoverageNotice
            onGroceryManager={() => navigation.navigate(guest ? '/guest/ai/grocery' : '/ai/grocery')}
          />
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

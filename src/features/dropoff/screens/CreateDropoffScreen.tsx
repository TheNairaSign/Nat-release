import { useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';

import {
  DROPOFF_SUCCESS_KEY,
  canSubmitCampaign,
  canSubmitSimple,
  distanceKmLabel,
  estimatedCu,
  materialLinesForSite,
  parseDropoffMode,
  quantitiesAsNumbers,
  type DropoffMode,
} from '@/core/dropoff';
import type { CapturedImage } from '@/shared/ports/camera';
import {
  fetchEventSites,
  fetchMaterialCatalog,
  fetchSimpleSites,
  submitCampaignDropoff,
  submitSimpleDropoff,
  type EventSite,
  type SimpleSite,
} from '../api/dropoff-api';
import {
  MaterialQuantityList,
  QuantityStepperNote,
} from '../ui/MaterialQuantityList';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';

const CHIP_LIMIT = 5;

export function CreateDropoffScreen({
  type,
  mode,
  locationId,
  campaignId,
  campaignLocationIndex,
}: {
  type?: string;
  mode?: string;
  locationId?: string;
  campaignId?: string;
  campaignLocationIndex?: string;
}) {
  const theme = useTheme();
  const { http, navigation, location, camera, kv } = usePorts();
  const [dropoffMode, setDropoffMode] = useState<DropoffMode>(
    parseDropoffMode(mode),
  );
  const [selectedSite, setSelectedSite] = useState<string | null>(
    locationId ?? null,
  );
  const [selectedEvent, setSelectedEvent] = useState<string | null>(
    campaignId ?? null,
  );
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [qty, setQty] = useState('1');
  const [photo, setPhoto] = useState<CapturedImage | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const listQuery = useQuery({
    queryKey: ['dropoff-create', dropoffMode, type],
    queryFn: async () => {
      const origin = await location.getCurrentPosition();
      if (dropoffMode === 'simple') {
        return {
          sites: await fetchSimpleSites(http, origin, type),
          events: [] as EventSite[],
        };
      }
      return {
        sites: [] as SimpleSite[],
        events: await fetchEventSites(http, false),
      };
    },
  });
  const catalogQuery = useQuery({
    queryKey: ['dropoff-material-catalog'],
    queryFn: () => fetchMaterialCatalog(http),
  });
  const sites = listQuery.data?.sites ?? [];
  const events = listQuery.data?.events ?? [];
  const loadingList = listQuery.isPending || listQuery.isFetching;

  async function load() {
    await listQuery.refetch();
  }

  const site = sites.find((item) => item.id === selectedSite) ?? null;
  const event = events.find((item) => item.id === selectedEvent) ?? null;
  const lines = site
    ? materialLinesForSite(
        site.materials,
        site.subtypes,
        catalogQuery.data ?? [],
      )
    : [];
  const qtyNumbers = quantitiesAsNumbers(quantities);
  const quantity = Number(qty) || 0;
  const canSubmit =
    dropoffMode === 'simple'
      ? canSubmitSimple(Boolean(photo), qtyNumbers)
      : canSubmitCampaign(Boolean(photo), quantity, Boolean(event));

  async function onSubmit() {
    if (!photo) {
      setError('Please capture a proof photo or video.');
      return;
    }
    const origin = (await location.getCurrentPosition()) ?? {
      latitude: 0,
      longitude: 0,
    };
    setPending(true);
    setError('');
    let carbonUnits = 0;
    if (dropoffMode === 'simple' && site) {
      const entries = Object.entries(qtyNumbers);
      if (entries.length === 0) {
        setPending(false);
        setError('Enter a quantity for at least one material.');
        return;
      }
      for (const [materialType, materialQty] of entries) {
        const result = await submitSimpleDropoff(http, {
          locationId: site.id,
          materialType,
          quantity: materialQty,
          latitude: origin.latitude,
          longitude: origin.longitude,
          photo,
        });
        if (!result.ok) {
          setPending(false);
          setError('Could not log drop-off.');
          return;
        }
        carbonUnits += result.carbonUnits;
      }
    } else if (event) {
      const result = await submitCampaignDropoff(http, {
        campaignId: event.id,
        materialType: type || event.materials[0] || 'plastic',
        quantity,
        latitude: origin.latitude,
        longitude: origin.longitude,
        photo,
        campaignLocationIndex: campaignLocationIndex
          ? Number(campaignLocationIndex)
          : 0,
      });
      if (!result.ok) {
        setPending(false);
        setError('Could not log drop-off.');
        return;
      }
      carbonUnits = result.carbonUnits;
    }
    await kv.set(DROPOFF_SUCCESS_KEY, {
      carbonUnits,
      dropoffType: dropoffMode,
      materialType: type,
    });
    setPending(false);
    navigation.navigate('/home');
  }

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.navigate('/home')} />
      <Pressable
        testID="log-previous"
        onPress={() => navigation.navigate('/log-dropoff')}
      >
        <Text
          style={{
            fontFamily: theme.font.semibold,
            textDecorationLine: 'underline',
          }}
        >
          Log previous drop-off
        </Text>
      </Pressable>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: theme.radius.sm,
          padding: 2,
          marginTop: 16,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        }}
      >
        {(['simple', 'campaign'] as const).map((id) => {
          const active = dropoffMode === id;
          return (
            <Pressable
              key={id}
              testID={`dropoff-mode-${id}`}
              onPress={() => setDropoffMode(id)}
              style={{
                flex: 1,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: active ? '#1e2937' : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: active ? '#fff' : '#4b5563',
                  fontFamily: theme.font.medium,
                }}
              >
                {id === 'simple' ? 'Static drop-off' : 'Event'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
        {dropoffMode === 'simple'
          ? 'Bins, boxes & partner sites'
          : 'Campaigns & timed events'}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        <Text style={{ fontFamily: theme.font.semibold, color: '#334155' }}>
          {dropoffMode === 'simple' ? 'Select nearby location' : 'Select event'}
        </Text>
        <Pressable
          testID="find-locations"
          onPress={() => {
            void load();
          }}
          style={{
            backgroundColor: '#1e2937',
            borderRadius: theme.radius.pill,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 14,
              fontFamily: theme.font.medium,
            }}
          >
            {dropoffMode === 'simple' ? 'Find Locations' : 'Find events'}
          </Text>
        </Pressable>
      </View>

      {loadingList ? (
        <Text
          muted
          style={{ marginTop: 8, textAlign: 'center', paddingVertical: 16 }}
        >
          {dropoffMode === 'simple' ? 'Finding locations…' : 'Finding events…'}
        </Text>
      ) : null}

      {!loadingList && dropoffMode === 'simple' && sites.length === 0 ? (
        <Text
          muted
          style={{
            marginTop: 8,
            textAlign: 'center',
            paddingVertical: 16,
            backgroundColor: '#f8fafc',
            borderRadius: theme.radius.lg,
          }}
        >
          No static drop-off locations found nearby. Try refreshing or check
          back later.
        </Text>
      ) : null}

      {!loadingList && dropoffMode === 'campaign' && events.length === 0 ? (
        <View
          style={{
            marginTop: 8,
            padding: 24,
            backgroundColor: '#f9fafb',
            borderRadius: theme.radius.lg,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: theme.font.medium, color: '#4b5563' }}>
            No Active Events Found
          </Text>
          <Text
            variant="small"
            muted
            style={{ marginTop: 8, textAlign: 'center' }}
          >
            No events are currently active in your area. Try a static drop-off
            instead.
          </Text>
        </View>
      ) : null}

      {dropoffMode === 'simple'
        ? sites.map((item) => {
            const selected = selectedSite === item.id;
            const chips = item.materials.slice(0, CHIP_LIMIT);
            const extra = item.materials.length - chips.length;
            return (
              <Pressable
                key={item.id}
                testID={`site-${item.id}`}
                onPress={() => {
                  setSelectedSite(item.id);
                  setQuantities({});
                }}
                style={{
                  marginTop: 8,
                  padding: 16,
                  borderRadius: theme.radius.sm,
                  backgroundColor: selected ? '#f0fdf4' : theme.color.surface,
                  borderWidth: 1,
                  borderColor: selected ? '#22c55e' : theme.color.borderSolid,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: theme.font.semibold }}>
                      {item.name}
                    </Text>
                    {item.address ? (
                      <Text variant="small" muted style={{ marginTop: 2 }}>
                        {item.address}
                      </Text>
                    ) : null}
                    {distanceKmLabel(item.km) ? (
                      <Text
                        variant="small"
                        style={{ marginTop: 4, color: '#475569' }}
                      >
                        {distanceKmLabel(item.km)}
                      </Text>
                    ) : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      {chips.length > 0 ? (
                        <>
                          {chips.map((material) => (
                            <View
                              key={`${item.id}-${material}`}
                              style={{
                                borderRadius: theme.radius.pill,
                                borderWidth: 1,
                                borderColor: '#e2e8f0',
                                backgroundColor: '#fff',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontFamily: theme.font.medium,
                                  color: '#334155',
                                }}
                              >
                                {material}
                              </Text>
                            </View>
                          ))}
                          {extra > 0 ? (
                            <View
                              style={{
                                borderRadius: theme.radius.pill,
                                backgroundColor: '#f1f5f9',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontFamily: theme.font.medium,
                                  color: '#334155',
                                }}
                              >
                                +{extra} more
                              </Text>
                            </View>
                          ) : null}
                        </>
                      ) : (
                        <Text variant="small" muted>
                          No materials listed
                        </Text>
                      )}
                    </View>
                  </View>
                  {selected ? (
                    <Text
                      style={{
                        color: '#22c55e',
                        fontSize: 18,
                        fontFamily: theme.font.bold,
                      }}
                    >
                      ✓
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        : events.map((item) => {
            const selected = selectedEvent === item.id;
            return (
              <Pressable
                key={item.id}
                testID={`event-${item.id}`}
                onPress={() => setSelectedEvent(item.id)}
                style={{
                  marginTop: 8,
                  padding: 16,
                  borderRadius: theme.radius.sm,
                  backgroundColor: selected ? '#f0fdf4' : theme.color.surface,
                  borderWidth: 1,
                  borderColor: selected ? '#22c55e' : theme.color.borderSolid,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: theme.font.semibold }}>
                      {item.name}
                    </Text>
                    {item.description ? (
                      <Text variant="small" muted style={{ marginTop: 2 }}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? (
                    <Text
                      style={{
                        color: '#22c55e',
                        fontSize: 18,
                        fontFamily: theme.font.bold,
                      }}
                    >
                      ✓
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
      {site || event ? (
        <>
          <Text style={{ marginTop: 16, fontFamily: theme.font.semibold }}>
            What did you drop off?
          </Text>
          {dropoffMode === 'simple' && site ? (
            <>
              <MaterialQuantityList
                lines={lines}
                quantities={quantities}
                loading={catalogQuery.isPending}
                onChange={(id, value) =>
                  setQuantities((prev) => ({ ...prev, [id]: value }))
                }
              />
              <QuantityStepperNote estimated={estimatedCu(lines, qtyNumbers)} />
            </>
          ) : (
            <TextInput
              testID="dropoff-qty"
              keyboardType="number-pad"
              value={qty}
              onChangeText={setQty}
              placeholder="Number of items"
              placeholderTextColor={theme.color.placeholder}
              style={{
                marginTop: 8,
                borderWidth: 1,
                borderColor: theme.color.inputBorder,
                borderRadius: theme.radius.md,
                padding: 12,
                color: theme.color.text,
              }}
            />
          )}
          <Text
            style={{
              marginTop: 16,
              fontFamily: theme.font.semibold,
              color: '#1e2937',
            }}
          >
            Verification picture
          </Text>
          <Text
            style={{
              marginTop: 4,
              marginBottom: 12,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            Take or upload a photo as proof.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              testID="take-photo"
              onPress={async () => setPhoto(await camera.takePhoto())}
              style={{
                width: 120,
                height: 120,
                borderRadius: theme.radius.lg,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#d1d5db',
                backgroundColor: '#f9fafb',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {photo ? (
                <Image
                  source={{ uri: photo.uri }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: theme.font.medium,
                    color: '#4b5563',
                  }}
                >
                  Take photo
                </Text>
              )}
            </Pressable>
            <Pressable
              testID="upload-photo"
              onPress={async () => setPhoto(await camera.pickImage())}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: theme.radius.pill,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                backgroundColor: '#fff',
              }}
            >
              <Text style={{ fontFamily: theme.font.medium, color: '#334155' }}>
                Upload a photo
              </Text>
            </Pressable>
          </View>
          <Pressable
            testID="log-dropoff-submit"
            disabled={!canSubmit || pending}
            onPress={() => {
              void onSubmit();
            }}
            style={{
              marginTop: 20,
              backgroundColor: '#1e2937',
              borderRadius: theme.radius.pill,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: !canSubmit || pending ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 18,
                fontFamily: theme.font.semibold,
              }}
            >
              {pending
                ? 'Processing…'
                : dropoffMode === 'simple'
                  ? 'Log drop-off'
                  : 'Log event drop-off'}
            </Text>
          </Pressable>
        </>
      ) : null}
      {error ? (
        <Text style={{ color: theme.color.danger, marginTop: 8 }}>{error}</Text>
      ) : null}
    </ChromeScreen>
  );
}

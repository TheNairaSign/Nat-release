import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  eventWhen,
  formatDistance,
  wherePlaceHref,
  type DiversionGuidance,
  type NearbyDropoff,
  type NearbyEvent,
} from '@/core/ai';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import {
  AlertTriangleGlyph,
  CalendarGlyph,
  ExternalLinkGlyph,
  MapPinGlyph,
} from '@/shared/ui/icons/featherGlyphs';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';

import { fetchNearestDropoffs, fetchNearestEvents } from '../api/nearby-api';

type Coords = { latitude: number; longitude: number };
type Status = 'idle' | 'searching' | 'no-location' | 'done' | 'failed';

/** web: `text-[12px] font-semibold uppercase tracking-wide text-slate-500` */
function Heading({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: 12,
        fontFamily: theme.font.semibold,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}
    >
      {children}
    </Text>
  );
}

/** web: `rounded-xl border border-black/[0.06] bg-white px-3 py-2.5` place rows */
const row = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.06)',
  backgroundColor: '#ffffff',
  paddingHorizontal: 12,
  paddingVertical: 10,
};

function LimeChevron() {
  // web: h-8 w-8 rounded-full bg-[#D1FF52] text-[#14361B] with FiChevronRight
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#D1FF52',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ChevronGlyph color="#14361B" size={14} direction="right" />
    </View>
  );
}

/**
 * The outside-world half of a divert answer: how to prepare the item, where to take it,
 * and a warning when one matters. "Where to take it" is NatCycle's own nearest drop-offs
 * for the material when there are any; the general kinds of places otherwise.
 * Web: components/ai/DiversionGuidanceCard.tsx.
 */
export function DiversionGuidanceCard({
  guidance,
}: {
  guidance: DiversionGuidance;
}) {
  const theme = useTheme();
  const { http, location, navigation, linking } = usePorts();
  const { steps, elsewhere, caution, material } = guidance;
  const mapsPlaces = guidance.nearby ?? [];
  const [places, setPlaces] = useState<NearbyDropoff[] | null>(null);
  const [events, setEvents] = useState<NearbyEvent[] | null>(null);
  const [status, setStatus] = useState<Status>(material ? 'searching' : 'idle');

  async function search(from: Coords | null) {
    if (!material) return;
    if (!from) {
      setStatus('no-location');
      return;
    }
    setStatus('searching');
    const [found, upcoming] = await Promise.all([
      fetchNearestDropoffs(http, material, from),
      fetchNearestEvents(http, material, from),
    ]);
    setPlaces(found);
    setEvents(upcoming);
    // A failed lookup quietly leaves the general advice; it never claims "none nearby".
    setStatus(found === null ? 'failed' : 'done');
  }

  useEffect(() => {
    if (!material) return;
    let cancelled = false;
    // Silent: uses location only if it's already allowed.
    location
      .getCurrentPosition()
      .catch(() => null)
      .then((from) => {
        if (!cancelled) void search(from);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

  async function locateAndSearch() {
    const allowed = await location.requestPermission().catch(() => false);
    const from = allowed ? await location.getCurrentPosition().catch(() => null) : null;
    await search(from);
  }

  const nearby = places && places.length > 0 ? places : null;
  if (
    steps.length === 0 &&
    elsewhere.length === 0 &&
    mapsPlaces.length === 0 &&
    !caution &&
    !material
  ) {
    return null;
  }

  const note = { marginTop: 8, fontSize: 12.5, color: '#64748b' };

  return (
    <View
      testID="ai-guidance"
      style={{
        marginTop: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        backgroundColor: '#F7F8F4',
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      {steps.length > 0 ? (
        <View>
          <Heading>How to prepare it</Heading>
          <View style={{ marginTop: 8, gap: 6 }}>
            {steps.map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <View
                  style={{
                    marginTop: 1,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#DCFE77',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: theme.font.bold, color: '#1A1A2E' }}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={{ flex: 1, fontSize: 14, lineHeight: 19, color: '#1A1A2E' }}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: steps.length > 0 ? 14 : 0 }}>
        {nearby && material ? (
          <>
            <Heading>Nearest drop-offs</Heading>
            <View style={{ marginTop: 8, gap: 6 }}>
              {nearby.map((place) => (
                <Pressable
                  key={place.id}
                  testID={`ai-nearby-${place.id}`}
                  // Opens the place on our own map, not an outside maps app.
                  onPress={() => navigation.navigate(wherePlaceHref(place, material))}
                  style={row}
                >
                  <MapPinGlyph color="#1F5D20" size={16} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#1A1A2E' }}
                    >
                      {place.name}
                    </Text>
                    {place.address ? (
                      <Text numberOfLines={1} style={{ fontSize: 12, color: '#64748b' }}>
                        {place.address}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 12.5, fontFamily: theme.font.semibold, color: '#1F5D20' }}>
                    {formatDistance(place.distanceKm)}
                  </Text>
                  <LimeChevron />
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() =>
                navigation.navigate(`/where?materialType=${encodeURIComponent(material)}`)
              }
              style={{ marginTop: 8 }}
            >
              <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#408558' }}>
                See all on the map →
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {elsewhere.length > 0 && mapsPlaces.length === 0 ? (
              <>
                <Heading>Other places that take it</Heading>
                <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {elsewhere.map((place, i) => (
                    <View
                      key={i}
                      style={{
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.08)',
                        backgroundColor: '#ffffff',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ fontSize: 12.5, color: '#1A1A2E' }}>{place}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
            {status === 'done' ? (
              <Text style={note}>No NatCycle drop-offs for this within 30 miles yet.</Text>
            ) : null}
            {status === 'searching' ? (
              <Text style={note}>Looking for drop-offs near you…</Text>
            ) : null}
            {status === 'no-location' ? (
              <Pressable
                testID="ai-guidance-locate"
                onPress={() => void locateAndSearch()}
                style={{
                  marginTop: 10,
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.08)',
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <MapPinGlyph color="#1F5D20" size={14} />
                <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: '#1F5D20' }}>
                  Use my location to find the nearest drop-off
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      {mapsPlaces.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <Heading>{nearby ? 'More places near you' : 'Places near you'}</Heading>
          <View style={{ marginTop: 8, gap: 6 }}>
            {mapsPlaces.map((place) => (
              <Pressable
                key={place.placeId ?? place.mapsUrl}
                onPress={() => void linking.openUrl(place.mapsUrl)}
                style={row}
              >
                <MapPinGlyph color="#1F5D20" size={16} />
                <Text
                  numberOfLines={1}
                  style={{ flex: 1, fontSize: 14, fontFamily: theme.font.semibold, color: '#1A1A2E' }}
                >
                  {place.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Maps</Text>
                  <ExternalLinkGlyph color="#64748b" size={14} />
                </View>
              </Pressable>
            ))}
          </View>
          {/* Google's terms: places grounded on Maps carry its attribution. */}
          <Text style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>From Google Maps</Text>
        </View>
      ) : null}

      {events && events.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <Heading>Nearby events</Heading>
          <View style={{ marginTop: 8, gap: 6 }}>
            {events.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => navigation.navigate(`/campaigns/${event.id}`)}
                style={row}
              >
                <CalendarGlyph color="#1F5D20" size={16} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#1A1A2E' }}
                  >
                    {event.name}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: '#64748b' }}>
                    {eventWhen(event)}
                    {event.placeName ? ` · ${event.placeName}` : ''}
                  </Text>
                </View>
                <Text style={{ fontSize: 12.5, fontFamily: theme.font.semibold, color: '#1F5D20' }}>
                  {formatDistance(event.distanceKm)}
                </Text>
                <LimeChevron />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {caution ? (
        <View
          style={{
            marginTop: 14,
            flexDirection: 'row',
            gap: 8,
            borderRadius: 12,
            backgroundColor: '#FFF4DC',
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <View style={{ marginTop: 2 }}>
            <AlertTriangleGlyph color="#7A4B00" size={16} />
          </View>
          <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: '#7A4B00' }}>
            {caution}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

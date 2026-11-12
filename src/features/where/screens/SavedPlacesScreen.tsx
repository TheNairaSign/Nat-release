import { Pressable, View } from 'react-native';

import { useQuery, useQueryClient } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, Text } from '@/shared/ui';
import { BullhornGlyph, ChevronGlyph } from '@/shared/ui/icons/glyphs';
import { NavMapMarkerGlyph } from '@/shared/ui/icons/navBarGlyphs';
import { HeartGlyph, HeartOutlineGlyph } from '@/shared/ui/icons/whereGlyphs';

import {
  fetchSavedPlaces,
  savedPlacesQueryKey,
  unsavePlace,
  type SavedPlace,
} from '../api/saved-api';

const when = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

/** Web SavedPlaces: every location and event they've hearted on WHERE, newest first. */
export function SavedPlacesScreen() {
  const theme = useTheme();
  const { http, navigation } = usePorts();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: savedPlacesQueryKey,
    queryFn: () => fetchSavedPlaces(http),
  });
  const saved = query.data ?? [];

  async function remove(item: SavedPlace) {
    queryClient.setQueryData<SavedPlace[]>(savedPlacesQueryKey, (rows) =>
      (rows ?? []).filter((row) => row.id !== item.id),
    );
    try {
      await unsavePlace(http, item.targetType, item.targetId);
    } finally {
      void queryClient.invalidateQueries({ queryKey: savedPlacesQueryKey });
    }
  }

  // Opens WHERE on the place's own card (web only goes to the map).
  const open = (item: SavedPlace) =>
    navigation.navigate(
      item.targetType === 'campaign'
        ? `/where?eventId=${encodeURIComponent(item.targetId)}`
        : `/where?locationId=${encodeURIComponent(item.targetId)}`,
    );

  return (
    <ChromeScreen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, paddingBottom: 16 }}>
        <Pressable
          testID="saved-places-back"
          accessibilityLabel="Back"
          onPress={() => navigation.back()}
          style={{ marginLeft: -8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronGlyph color="#111111" size={18} direction="left" />
        </Pressable>
        <Text style={{ fontSize: 18, fontFamily: theme.font.bold, color: '#111111' }}>My Places</Text>
      </View>

      {query.isPending ? (
        <View testID="saved-places-loading" style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ height: 72, borderRadius: 16, backgroundColor: '#f1f5f9' }} />
          ))}
        </View>
      ) : saved.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 56 }}>
          <HeartOutlineGlyph color="#cbd5e1" size={28} />
          <Text style={{ marginTop: 12, fontSize: 15, fontFamily: theme.font.semibold, color: '#1A1A2E' }}>
            Nothing saved yet
          </Text>
          <Text style={{ marginTop: 4, maxWidth: 240, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            Tap the heart on a location or event in WHERE to keep it here.
          </Text>
          <Pressable
            testID="saved-places-where"
            onPress={() => navigation.navigate('/where')}
            style={{ marginTop: 16, borderRadius: 999, backgroundColor: '#D1FF52', paddingHorizontal: 20, paddingVertical: 10 }}
          >
            <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: '#14361B' }}>Go to WHERE</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {saved.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.04)',
                backgroundColor: '#ffffff',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.targetType === 'campaign' ? (
                  <BullhornGlyph color="#475569" size={16} />
                ) : (
                  <NavMapMarkerGlyph color="#475569" size={16} />
                )}
              </View>
              <Pressable testID={`saved-place-${item.targetId}`} onPress={() => open(item)} style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: theme.font.semibold, color: '#111111' }}>
                  {item.targetName || '(deleted or renamed)'}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: '#64748b' }}>
                  {item.targetType === 'campaign' ? 'Event' : 'Location'}
                  {item.createdAt ? ` · Saved ${when(item.createdAt)}` : ''}
                </Text>
              </Pressable>
              <Pressable
                testID={`saved-place-remove-${item.targetId}`}
                accessibilityLabel="Remove from My Places"
                hitSlop={8}
                onPress={() => void remove(item)}
                style={{ padding: 6 }}
              >
                <HeartGlyph color="#fb7185" size={16} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ChromeScreen>
  );
}

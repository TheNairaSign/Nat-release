import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/Text';

import type { MapMarker } from './WhereMap';

export type { MapMarker } from './WhereMap';

/**
 * Web stand-in for the Mapbox map.
 *
 * `@rnmapbox/maps` is native-only — it ships no web implementation — and it is
 * the single reason `expo start --web` cannot render the app. Metro resolves
 * `.web.tsx` ahead of `.tsx`, so this file keeps the web bundle building while
 * the native map is untouched.
 *
 * It is a **preview aid, not a port**: markers are listed rather than plotted,
 * so the surrounding Where chrome (panels, sheets, filters, search) can be
 * reviewed in a browser. Do not treat what renders here as map parity — that
 * still has to be checked on a device.
 */
export function WhereMap({
  center,
  zoom,
  markers,
  showsUser,
  children,
  onMarkerPress,
}: {
  center: { latitude: number; longitude: number };
  zoom: number;
  markers: MapMarker[];
  showsUser: boolean;
  children: (marker: MapMarker) => React.ReactNode;
  onMarkerPress: (id: string) => void;
}) {
  return (
    <View
      testID="where-map"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: '#E8EDE9', padding: 12 },
      ]}
    >
      <Text style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>
        Map preview unavailable on web · {markers.length} marker
        {markers.length === 1 ? '' : 's'} · centre {center.latitude.toFixed(3)},{' '}
        {center.longitude.toFixed(3)} · zoom {zoom.toFixed(1)}
        {showsUser ? ' · user location on' : ''}
      </Text>
      <ScrollView
        contentContainerStyle={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {markers.map((marker) => (
          <Pressable
            key={marker.id}
            onPress={() => onMarkerPress(marker.id)}
            style={{ opacity: marker.selected ? 1 : 0.85 }}
          >
            {children(marker)}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

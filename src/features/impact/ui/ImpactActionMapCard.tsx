import { useMemo } from 'react';
import { View } from 'react-native';

import {
  ACTION_MAP_CENTER,
  actionMapCircleSize,
  actionMapLabel,
  actionMapZoom,
  type ActionMapPoint,
} from '@/core/impact';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { WhereMap, type MapMarker } from '@/shared/ui/maps/WhereMap';

/**
 * Port of client/src/pages/dashboard/components/ImpactActionMapCard.tsx.
 *
 * Restores three things the inline version dropped:
 *  - circles **scaled by quantity** (12→52px, sqrt scale). It drew every point
 *    as a fixed 16px dot, so a site with 40 drop-offs looked like one with 1.
 *  - the caption as a **centred white pill** at the bottom; it was plain text
 *    pinned bottom-left.
 *  - the single-point caption (the site's own name) and the loading caption.
 */
export function ImpactActionMapCard({
  points,
  loading,
}: {
  points: ActionMapPoint[];
  loading: boolean;
}) {
  const theme = useTheme();

  const maxQty = useMemo(
    () => points.reduce((m, p) => Math.max(m, p.quantity), 0),
    [points],
  );

  // Web calls fitBounds over the points; the native map takes a centre plus a
  // zoom, so the bounding box is converted with web's own zoomForSpan ladder.
  const view = useMemo(() => {
    if (points.length === 0) return { center: ACTION_MAP_CENTER, zoom: 10 };
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      center: {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
      },
      zoom: actionMapZoom(maxLng - minLng, maxLat - minLat),
    };
  }, [points]);

  const markers = useMemo(
    () =>
      points.map((p) => ({
        id: p.key,
        lat: p.lat,
        lng: p.lng,
        selected: false,
      })),
    [points],
  );

  return (
    <View
      style={{
        height: 440,
        borderRadius: theme.radius.card28,
        borderWidth: 1,
        borderColor: theme.color.borderSolid,
        backgroundColor: theme.color.surface,
        overflow: 'hidden',
      }}
    >
      <WhereMap
        center={view.center}
        zoom={view.zoom}
        showsUser
        markers={markers}
        onMarkerPress={() => undefined}
      >
        {(marker: MapMarker) => {
          const point = points.find((p) => p.key === marker.id);
          const size = actionMapCircleSize(point?.quantity ?? 0, maxQty);
          return (
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: theme.color.commitFill,
                opacity: 0.9,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.7)',
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
            />
          );
        }}
      </WhereMap>

      {/* `absolute bottom-4 left-0 right-0 text-center` with a translucent pill */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: theme.radius.pill,
            paddingHorizontal: 12,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 15, color: theme.color.text }}>
            {actionMapLabel(points, loading)}
          </Text>
        </View>
      </View>
    </View>
  );
}

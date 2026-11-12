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
import { NavHomeFilledGlyph } from '@/shared/ui/icons/navBarGlyphs';
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
/** What was kept from landfill at home, pinned where the person is. */
export type HomeMapPoint = { lat: number; lng: number; total: number };

const HOME_ID = '__home__';

export function ImpactActionMapCard({
  points,
  loading,
  home,
  onTouchingChange,
}: {
  points: ActionMapPoint[];
  loading: boolean;
  home?: HomeMapPoint | null;
  /** True while a finger is on the map, so the page and carousel stop scrolling. */
  onTouchingChange?: (touching: boolean) => void;
}) {
  const theme = useTheme();

  const maxQty = useMemo(
    () => points.reduce((m, p) => Math.max(m, p.quantity, home?.total ?? 0), 0),
    [points, home],
  );

  // Web calls fitBounds over the points; the native map takes a centre plus a
  // zoom, so the bounding box is converted with web's own zoomForSpan ladder.
  const view = useMemo(() => {
    const all = home ? [...points, { lat: home.lat, lng: home.lng }] : points;
    if (all.length === 0) return { center: ACTION_MAP_CENTER, zoom: 10 };
    const lats = all.map((p) => p.lat);
    const lngs = all.map((p) => p.lng);
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
  }, [points, home]);

  const markers = useMemo(
    () => [
      ...points.map((p) => ({
        id: p.key,
        lat: p.lat,
        lng: p.lng,
        selected: false,
      })),
      ...(home ? [{ id: HOME_ID, lat: home.lat, lng: home.lng, selected: false }] : []),
    ],
    [points, home],
  );

  return (
    <View
      testID="impact-action-map"
      onTouchStart={() => onTouchingChange?.(true)}
      onTouchEnd={() => onTouchingChange?.(false)}
      onTouchCancel={() => onTouchingChange?.(false)}
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
        // Position once, then let the user pinch/pan freely.
        cameraMode="initial"
        showsUser
        markers={markers}
        onMarkerPress={() => undefined}
      >
        {(marker: MapMarker) => {
          if (marker.id === HOME_ID && home) {
            const size = Math.max(36, actionMapCircleSize(home.total, maxQty));
            return (
              <View
                testID="impact-map-home"
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: '#D3FD5D',
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 4,
                }}
              >
                <NavHomeFilledGlyph color="#1E0D2A" />
                <Text style={{ fontSize: 10, lineHeight: 12, color: '#1E0D2A', fontWeight: '700' }}>
                  {home.total}
                </Text>
              </View>
            );
          }
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
            {home && home.total > 0 ? ` · ${home.total} at home` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

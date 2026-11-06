import type { ReactNode } from 'react';
import Mapbox from '@rnmapbox/maps';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getEnv } from '@/shared/config/env';

/** Room around each marker for its glow and badge; see the MarkerView note. */
const MARKER_BLEED = 24;

/** A box to fit the camera to, with room kept clear at each edge (web fitBounds). */
export type MapFrame = {
  ne: [number, number];
  sw: [number, number];
  padding: { top: number; bottom: number; left: number; right: number };
};

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  selected: boolean;
};

export function WhereMap({
  center,
  zoom,
  markers,
  showsUser,
  children,
  onMarkerPress,
  cameraMode = 'follow',
  frame,
  onZoomChange,
}: {
  center: { latitude: number; longitude: number };
  zoom: number;
  markers: MapMarker[];
  showsUser: boolean;
  children: (marker: MapMarker) => ReactNode;
  onMarkerPress: (id: string) => void;
  /**
   * `follow` (default) keeps the camera bound to `center`/`zoom` — Where needs
   * this so selecting a place recentres the map.
   *
   * `initial` positions the camera once and then leaves it alone. A controlled
   * Camera re-applies its `zoomLevel` on every render, which silently undoes
   * the user's pinch — that is why the Impact map would not zoom.
   */
  cameraMode?: 'follow' | 'initial';
  /** When set, the camera fits this box instead of `center`/`zoom`. */
  frame?: MapFrame | null;
  /** The zoom as the person pinches, for markers that change with it. */
  onZoomChange?: (zoom: number) => void;
}) {
  useEffect(() => {
    Mapbox.setAccessToken(getEnv().mapboxToken);
  }, []);

  // The camera moves whenever these change identity, so they're kept stable: a re-render
  // (a reported zoom, a loaded list) mustn't undo the person's own pinch or pan.
  const centerCoordinate = useMemo(
    () => [center.longitude, center.latitude],
    [center.longitude, center.latitude],
  );
  const frameKey = frame
    ? `${frame.ne.join()}|${frame.sw.join()}|${Object.values(frame.padding).join()}`
    : '';
  const bounds = useMemo(
    () =>
      frame
        ? {
            ne: frame.ne,
            sw: frame.sw,
            paddingTop: frame.padding.top,
            paddingBottom: frame.padding.bottom,
            paddingLeft: frame.padding.left,
            paddingRight: frame.padding.right,
          }
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frameKey],
  );

  return (
    <Mapbox.MapView
      testID="where-map"
      style={StyleSheet.absoluteFill}
      styleURL="mapbox://styles/mapbox/streets-v12"
      scaleBarEnabled={false}
      logoEnabled={false}
      attributionEnabled={false}
      onCameraChanged={
        onZoomChange ? (state) => onZoomChange(state.properties.zoom) : undefined
      }
    >
      {cameraMode === 'follow' && frame && bounds ? (
        <Mapbox.Camera
          bounds={bounds}
          animationDuration={900}
        />
      ) : cameraMode === 'follow' ? (
        <Mapbox.Camera
          centerCoordinate={centerCoordinate}
          zoomLevel={zoom}
          animationDuration={700}
        />
      ) : (
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate: [center.longitude, center.latitude],
            zoomLevel: zoom,
          }}
        />
      )}
      {showsUser ? <Mapbox.UserLocation visible animated /> : null}
      {markers.map((marker) => (
        // MarkerView, not PointAnnotation: on Android PointAnnotation
        // rasterises its children into a bitmap, which drops the drop-shadow,
        // squares off `borderRadius` (circles became boxes) and mangles the
        // absolutely-positioned secondary-material badge. MarkerView mounts
        // real RN views over the map, so all three survive.
        <Mapbox.MarkerView
          key={marker.id}
          coordinate={[marker.lng, marker.lat]}
          allowOverlap
          anchor={{ x: 0.5, y: 0.5 }}
        >
          {/* Bleed room: MarkerView's native container on Android is sized
              to its child and clips anything outside it. The pin's drop-glow
              extends ~19px past the body and the secondary-material badge
              sits at -25% bottom-right, so without this padding both were
              cut off. Symmetric, so the anchor still centres the pin, and
              `box-none` so the padding itself never steals a tap from a
              neighbouring pin. */}
          <View pointerEvents="box-none" style={{ padding: MARKER_BLEED }}>
            <Pressable
              testID={`where-place-${marker.id}`}
              accessibilityRole="button"
              onPress={() => onMarkerPress(marker.id)}
            >
              {children(marker)}
            </Pressable>
          </View>
        </Mapbox.MarkerView>
      ))}
    </Mapbox.MapView>
  );
}

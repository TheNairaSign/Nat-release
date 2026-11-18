import type { ReactNode } from 'react';
import Mapbox from '@rnmapbox/maps';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MarkerSpec } from '@/core/where';
import { getEnv } from '@/shared/config/env';

import { PinArtwork } from './PinArtwork';

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
  /** With `pinLayer`: the name of the pin picture this marker uses. */
  icon?: string;
};

/** A map style expression (zoom-driven icon size). */
type StyleExpression = readonly unknown[];

/**
 * Pins drawn by the map itself: each distinct pin is a picture (a symbol image) and a
 * native layer places them, so they stay glued to the map while it pans and zooms.
 * Without it, markers are views laid over the map, which trail behind on a phone.
 */
export type PinLayer = {
  /** Every distinct pin picture in use, drawn at its largest size. */
  images: { name: string; spec: MarkerSpec }[];
  /** Scale of a pin picture by zoom, for unselected and the open pin. */
  iconSize: StyleExpression;
  selectedIconSize: StyleExpression;
  /** Below this zoom an unselected pin is a small dot. */
  dotMaxZoom: number;
};

/** One pin picture. Redrawn once a remote URS icon has loaded into it. */
const PinImage = memo(function PinImage({ name, spec }: { name: string; spec: MarkerSpec }) {
  const ref = useRef<{ refresh: () => void } | null>(null);
  return (
    <Mapbox.Image name={name} ref={ref}>
      <PinArtwork spec={spec} onGlyphLoad={() => ref.current?.refresh()} />
    </Mapbox.Image>
  );
});

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
  flyTo,
  pinLayer,
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
  /**
   * A one-off move, e.g. the locate button. A new `key` flies there even when the
   * target equals the current `center` — the person may have panned away since, and a
   * controlled camera with unchanged props would stay where they left it.
   */
  flyTo?: { key: number; latitude: number; longitude: number; zoom: number } | null;
  /** Draw pins natively (see PinLayer); `children` is then unused. */
  pinLayer?: PinLayer | null;
}) {
  const cameraRef = useRef<Mapbox.Camera>(null);

  useEffect(() => {
    Mapbox.setAccessToken(getEnv().mapboxToken);
  }, []);

  useEffect(() => {
    if (!flyTo) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [flyTo.longitude, flyTo.latitude],
      zoomLevel: flyTo.zoom,
      animationDuration: 800,
    });
    // Only a new key means a new move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.key]);

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

  const pinShape = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: markers.map((marker) => ({
        type: 'Feature' as const,
        id: marker.id,
        properties: { id: marker.id, icon: marker.icon ?? '', sel: marker.selected },
        geometry: { type: 'Point' as const, coordinates: [marker.lng, marker.lat] },
      })),
    }),
    [markers],
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
          ref={cameraRef}
          bounds={bounds}
          animationDuration={900}
        />
      ) : cameraMode === 'follow' ? (
        <Mapbox.Camera
          ref={cameraRef}
          centerCoordinate={centerCoordinate}
          zoomLevel={zoom}
          animationDuration={700}
        />
      ) : (
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [center.longitude, center.latitude],
            zoomLevel: zoom,
          }}
        />
      )}
      {showsUser ? <Mapbox.UserLocation visible animated /> : null}
      {pinLayer ? (
        <>
          <Mapbox.Images>
            {pinLayer.images.map((image) => (
              <PinImage key={image.name} name={image.name} spec={image.spec} />
            ))}
          </Mapbox.Images>
          <Mapbox.ShapeSource
            id="where-pins"
            shape={pinShape}
            // A finger is bigger than a dot: taps land within 44pt of a pin.
            hitbox={{ width: 44, height: 44 }}
            onPress={(event) => {
              // The open pin is drawn on top, so it wins a tap on overlapping pins.
              const hit =
                event.features.find((f) => f.properties?.sel) ?? event.features[0];
              const id = hit?.properties?.id;
              if (typeof id === 'string') onMarkerPress(id);
            }}
          >
            <Mapbox.CircleLayer
              id="where-pin-dots"
              maxZoomLevel={pinLayer.dotMaxZoom}
              filter={['!', ['get', 'sel']]}
              style={{
                circleRadius: 5,
                circleColor: '#1F5D20',
                circleStrokeWidth: 1,
                circleStrokeColor: '#ffffff',
              }}
            />
            <Mapbox.SymbolLayer
              id="where-pins-layer"
              minZoomLevel={pinLayer.dotMaxZoom}
              filter={['!', ['get', 'sel']]}
              style={{
                iconImage: ['get', 'icon'],
                iconSize: pinLayer.iconSize as any,
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
              }}
            />
            <Mapbox.SymbolLayer
              id="where-pin-open"
              filter={['get', 'sel']}
              style={{
                iconImage: ['get', 'icon'],
                iconSize: pinLayer.selectedIconSize as any,
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
              }}
            />
          </Mapbox.ShapeSource>
        </>
      ) : null}
      {pinLayer ? null : markers.map((marker) => (
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

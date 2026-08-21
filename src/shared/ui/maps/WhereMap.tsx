import type { ReactNode } from 'react';
import Mapbox from '@rnmapbox/maps';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { getEnv } from '@/shared/config/env';

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
}: {
  center: { latitude: number; longitude: number };
  zoom: number;
  markers: MapMarker[];
  showsUser: boolean;
  children: (marker: MapMarker) => ReactNode;
  onMarkerPress: (id: string) => void;
}) {
  useEffect(() => {
    Mapbox.setAccessToken(getEnv().mapboxToken);
  }, []);

  return (
    <Mapbox.MapView
      testID="where-map"
      style={StyleSheet.absoluteFill}
      styleURL="mapbox://styles/mapbox/streets-v12"
      scaleBarEnabled={false}
      logoEnabled={false}
      attributionEnabled={false}
    >
      <Mapbox.Camera
        centerCoordinate={[center.longitude, center.latitude]}
        zoomLevel={zoom}
        animationDuration={700}
      />
      {showsUser ? <Mapbox.UserLocation visible animated /> : null}
      {markers.map((marker) => (
        <Mapbox.PointAnnotation
          key={marker.id}
          id={marker.id}
          coordinate={[marker.lng, marker.lat]}
          onSelected={() => onMarkerPress(marker.id)}
        >
          <View collapsable={false}>{children(marker)}</View>
        </Mapbox.PointAnnotation>
      ))}
    </Mapbox.MapView>
  );
}

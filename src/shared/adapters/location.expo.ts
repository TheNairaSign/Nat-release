import * as ExpoLocation from 'expo-location';

import type { Location } from '@/shared/ports/location';

export function createExpoLocation(): Location {
  return {
    async requestPermission() {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    },
    async getCurrentPosition() {
      const current = await ExpoLocation.getForegroundPermissionsAsync();
      if (current.status !== 'granted') return null;
      const position = await ExpoLocation.getCurrentPositionAsync({});
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    },
  };
}

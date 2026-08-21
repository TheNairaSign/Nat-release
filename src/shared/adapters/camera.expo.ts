import * as ImagePicker from 'expo-image-picker';

import type { Camera, CapturedImage } from '@/shared/ports/camera';

function fromAsset(
  asset: ImagePicker.ImagePickerAsset | undefined,
): CapturedImage | null {
  if (!asset?.uri) return null;
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const fileName = asset.fileName ?? `dropoff-photo-${Date.now()}.jpg`;
  return {
    uri: asset.uri,
    fileName,
    mimeType,
    base64: asset.base64 ?? undefined,
  };
}

export function createExpoCamera(): Camera {
  return {
    async requestPermission() {
      const camera = await ImagePicker.requestCameraPermissionsAsync();
      const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return camera.status === 'granted' || library.status === 'granted';
    },
    async takePhoto() {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') return null;
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.95,
        base64: true,
        mediaTypes: ['images'],
      });
      if (result.canceled) return null;
      return fromAsset(result.assets[0]);
    },
    async pickImage() {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') return null;
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.95,
        base64: true,
        mediaTypes: ['images'],
      });
      if (result.canceled) return null;
      return fromAsset(result.assets[0]);
    },
  };
}

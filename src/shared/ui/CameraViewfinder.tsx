import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MAX_PINCH, createPinchResponder } from './pinch-responder';
import { Text } from './Text';

/** Longest side of a captured photo: plenty for identification, quick to upload (web). */
const MAX_CAPTURE_PX = 1600;

export type PreparedPhoto = { base64: string; mimeType: 'image/jpeg'; uri: string };

/** A photo shrunk to MAX_CAPTURE_PX on its long side, as JPEG with its base64. */
export async function preparePhoto(
  uri: string,
  width?: number,
  height?: number,
): Promise<PreparedPhoto | null> {
  try {
    const context = ImageManipulator.manipulate(uri);
    if (width && height && Math.max(width, height) > MAX_CAPTURE_PX) {
      context.resize(width >= height ? { width: MAX_CAPTURE_PX } : { height: MAX_CAPTURE_PX });
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG, base64: true });
    return saved.base64 ? { base64: saved.base64, mimeType: 'image/jpeg', uri: saved.uri } : null;
  } catch {
    return null;
  }
}

export type CameraViewfinderHandle = {
  /** Takes a photo of what's framed; null when the camera isn't there. */
  capture(): Promise<PreparedPhoto | null>;
};

/**
 * The phone's back camera filling its parent, for an in-page viewfinder (web
 * useBackCamera). `onUnavailable` fires when there is no camera or no permission, so
 * the screen can offer a photo from the library instead.
 */
export const CameraViewfinder = forwardRef<
  CameraViewfinderHandle,
  { active: boolean; onReady?: () => void; onUnavailable?: () => void }
>(function CameraViewfinder({ active, onReady, onUnavailable }, ref) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  // Pinch the viewfinder to zoom; the camera takes 0..1 across its own range.
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  const pinch = useMemo(
    () => createPinchResponder({ getScale: () => scaleRef.current, onScale: setScale }),
    [],
  );
  const zoom = (scale - 1) / (MAX_PINCH - 1);

  useEffect(() => {
    if (!active || !permission) return;
    if (permission.granted) return;
    if (permission.canAskAgain) {
      void requestPermission().then((next) => {
        if (!next.granted) onUnavailable?.();
      });
    } else {
      onUnavailable?.();
    }
  }, [active, permission, requestPermission, onUnavailable]);

  useImperativeHandle(ref, () => ({
    async capture() {
      if (!camera.current || !ready) return null;
      try {
        const shot = await camera.current.takePictureAsync({ quality: 0.92, skipProcessing: false });
        return await preparePhoto(shot.uri, shot.width, shot.height);
      } catch {
        return null;
      }
    },
  }));

  if (!active || !permission?.granted) {
    return (
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B', paddingHorizontal: 24 }]}>
        <Text style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
          {permission && !permission.granted && !permission.canAskAgain
            ? 'Camera unavailable — tap the shutter to pick a photo'
            : 'Starting camera…'}
        </Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} {...pinch.panHandlers}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        zoom={zoom}
        onCameraReady={() => {
          setReady(true);
          onReady?.();
        }}
        onMountError={() => onUnavailable?.()}
      />
      {/* web: the zoom as "1.8×" at the top; tap it to zoom back out. */}
      {ready && scale > 1.05 ? (
        <Pressable
          testID="viewfinder-zoom"
          accessibilityLabel="Zoom back out"
          onPress={() => setScale(1)}
          style={{
            position: 'absolute',
            top: 20,
            alignSelf: 'center',
            zIndex: 10,
            borderRadius: 999,
            backgroundColor: 'rgba(0,0,0,0.55)',
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#ffffff' }}>{scale.toFixed(1)}×</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

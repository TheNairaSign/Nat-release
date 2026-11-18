process.env.EXPO_PUBLIC_API_URL ??= 'https://natcycle.app';
process.env.EXPO_PUBLIC_AI_API_URL ??= 'https://ai.example/api/v1';
process.env.EXPO_PUBLIC_AI_API_KEY ??= 'test-ai-key';
process.env.EXPO_PUBLIC_GOOGLE_API_KEY ??= 'test-google-key';
process.env.EXPO_PUBLIC_MAPBOX_TOKEN ??= 'test-mapbox-token';
process.env.EXPO_PUBLIC_URS_API_URL ??= 'https://urs.example/api/v1';
process.env.EXPO_PUBLIC_URS_API_KEY ??= 'test-urs-key';
process.env.EXPO_PUBLIC_APP_VARIANT ??= 'development';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: async () => ({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: async () => ({ status: 'granted' }),
  launchCameraAsync: async () => ({ canceled: true, assets: [] }),
  launchImageLibraryAsync: async () => ({ canceled: true, assets: [] }),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  getDevicePushTokenAsync: async () => ({ data: 'a'.repeat(120) }),
  setBadgeCountAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  osInternalBuildId: 'test-device',
  modelId: 'test-model',
}));

jest.mock('@rnmapbox/maps', () => {
  // jest.mock factories are hoisted; require is the supported way to load deps.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const React = require('react');
  const { Pressable, View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return {
    __esModule: true,
    default: {
      setAccessToken: jest.fn(),
      MapView: ({ children }: { children: React.ReactNode }) =>
        React.createElement(View, { testID: 'where-map' }, children),
      Camera: () => null,
      UserLocation: () => null,
      MarkerView: ({ children }: { children: React.ReactNode }) =>
        React.createElement(View, null, children),
      // Native pins: the layers draw nothing here; the source renders one tappable
      // stand-in per pin so tests can find and press them as before.
      Images: ({ children }: { children: React.ReactNode }) =>
        React.createElement(View, { testID: 'where-pin-images' }, children),
      Image: () => null,
      CircleLayer: () => null,
      SymbolLayer: () => null,
      ShapeSource: ({
        shape,
        onPress,
      }: {
        shape: { features: { properties: { id: string; icon: string } }[] };
        onPress?: (e: { features: unknown[] }) => void;
      }) =>
        React.createElement(
          View,
          null,
          shape.features.map((feature) =>
            React.createElement(Pressable, {
              key: feature.properties.id,
              testID: `where-place-${feature.properties.id}`,
              accessibilityLabel: feature.properties.icon,
              onPress: () => onPress?.({ features: [feature] }),
            }),
          ),
        ),
      PointAnnotation: ({
        id,
        onSelected,
        children,
      }: {
        id: string;
        onSelected?: () => void;
        children: React.ReactNode;
      }) =>
        React.createElement(
          Pressable,
          { testID: `where-place-${id}`, onPress: onSelected },
          children,
        ),
    },
  };
});

jest.mock('react-native-svg', () => {
  const Mock = () => null;
  return {
    __esModule: true,
    default: Mock,
    SvgXml: Mock,
    Svg: Mock,
    Path: Mock,
    Circle: Mock,
    Polyline: Mock,
  };
});

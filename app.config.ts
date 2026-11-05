import type { ConfigContext, ExpoConfig } from 'expo/config';

const variant = process.env.APP_VARIANT ?? 'development';

const variants = {
  development: {
    name: 'Natcycle Dev',
    slug: 'natcycle',
    scheme: 'natcycle-dev',
    bundleIdentifier: 'com.natcycle.app.dev',
    package: 'com.natcycle.app.dev',
  },
  preview: {
    name: 'Natcycle Preview',
    slug: 'natcycle',
    scheme: 'natcycle-preview',
    bundleIdentifier: 'com.natcycle.app.preview',
    package: 'com.natcycle.app.preview',
  },
  production: {
    name: 'Natcycle',
    slug: 'natcycle',
    scheme: 'natcycle',
    bundleIdentifier: 'com.natcycle.app',
    package: 'com.natcycle.app',
  },
} as const;

type Variant = keyof typeof variants;

const current =
  variants[
    (variant as Variant) in variants ? (variant as Variant) : 'development'
  ];

export default function createConfig(_ctx: ConfigContext): ExpoConfig {
  return {
    name: current.name,
    slug: 'natcycle-reactnative-mobile',
    owner: 'sundayprincedevs-team',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: current.scheme,
    // Web has no dark mode; keep the native shell light so system dark mode
    // does not repaint status bar / native surfaces around a light UI.
    userInterfaceStyle: 'light',
    ios: {
      bundleIdentifier: current.bundleIdentifier,
      icon: './assets/expo.icon',
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription:
          'Natcycle uses the camera to scan your groceries, snap what you are getting rid of, and capture drop-off proof photos.',
        NSMicrophoneUsageDescription:
          'Natcycle uses the microphone so you can ask DiVA and answer the scanner by voice.',
        NSSpeechRecognitionUsageDescription:
          'Natcycle turns what you say into text for DiVA and the scanners.',
        NSLocationWhenInUseUsageDescription:
          'Natcycle uses your location to show nearby drop-off points.',
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      package: current.package,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'ACCESS_FINE_LOCATION',
        'POST_NOTIFICATIONS',
      ],
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-localization',
      'expo-location',
      'expo-image-picker',
      // The Grocery Manager and SnapDivert viewfinders, and voice answers. These need a
      // development build (`pnpm start:dev` with the dev client), not Expo Go.
      'expo-camera',
      'expo-audio',
      'expo-speech-recognition',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#204C27',
        },
      ],
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsVersion: '11.23.1',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#1B5E3B',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/72460051-4e29-4ea4-9a65-a7d376bda490',
    },
    extra: {
      appVariant: variant,
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID ?? '72460051-4e29-4ea4-9a65-a7d376bda490',
      },
    },
  };
}

import { getEnv, resetEnvCache } from '../env';

describe('getEnv', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    resetEnvCache();
  });

  it('prefixes https when the API host has no scheme', () => {
    process.env.EXPO_PUBLIC_API_URL =
      'natcyclewebapp-be-production.up.railway.app';
    process.env.EXPO_PUBLIC_AI_API_URL = 'https://ai.example/api/v1';
    process.env.EXPO_PUBLIC_AI_API_KEY = 'ai-key';
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = 'google-key';
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'mapbox-token';
    process.env.EXPO_PUBLIC_URS_API_URL = 'https://urs.example/api/v1';
    process.env.EXPO_PUBLIC_URS_API_KEY = 'urs-key';
    process.env.EXPO_PUBLIC_APP_VARIANT = 'development';
    resetEnvCache();

    expect(getEnv().apiUrl).toBe(
      'https://natcyclewebapp-be-production.up.railway.app',
    );
  });
});

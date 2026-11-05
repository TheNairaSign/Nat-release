import { divaOriginFor, getEnv, resetEnvCache } from '../env';

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

describe('divaOriginFor', () => {
  it('names the web app on the same server, so DiVA counts the question there', () => {
    expect(divaOriginFor('https://natcyclewebapp-be-production.up.railway.app')).toBe(
      'https://natcycle.app',
    );
    expect(divaOriginFor('https://natcyclebackend-dev.up.railway.app')).toBe(
      'https://natcycle-dev.up.railway.app',
    );
  });

  it('meters nothing against a local server', () => {
    expect(divaOriginFor('http://localhost:5001')).toBeNull();
  });
});

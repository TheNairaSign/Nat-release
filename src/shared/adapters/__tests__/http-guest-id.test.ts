import { createHttpClient } from '../http.expo-fetch';

const calls: { url: string; headers: Record<string, string> }[] = [];
jest.mock('expo/fetch', () => ({
  fetch: async (url: string, init: { headers: Record<string, string> }) => {
    calls.push({ url, headers: init.headers });
    return { status: 200, text: async () => '{}' };
  },
}));

const GUEST = '0f8e4a2c-1d3b-4f5a-9e7d-2b6c8a1f0e3d';

describe('http client guest id', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it('sends x-guest-id to our API when signed out', async () => {
    const http = createHttpClient('https://api.test/api', {
      getToken: async () => 'guest',
      getGuestId: async () => GUEST,
    });
    await http.request({ path: '/allowance/me' });
    expect(calls[0]?.headers['x-guest-id']).toBe(GUEST);
    expect(calls[0]?.headers.Authorization).toBeUndefined();
  });

  it('sends the bearer token instead when signed in', async () => {
    const http = createHttpClient('https://api.test/api', {
      getToken: async () => 'jwt',
      getGuestId: async () => GUEST,
    });
    await http.request({ path: '/allowance/me' });
    expect(calls[0]?.headers.Authorization).toBe('Bearer jwt');
    expect(calls[0]?.headers['x-guest-id']).toBeUndefined();
  });

  it('keeps it off other services (DiVA gets it in the body)', async () => {
    const http = createHttpClient('https://api.test/api', {
      getGuestId: async () => GUEST,
    });
    await http.request({ path: 'https://diva.test/chat', token: '' });
    expect(calls[0]?.headers['x-guest-id']).toBeUndefined();
  });
});

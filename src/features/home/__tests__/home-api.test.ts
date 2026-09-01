import { fetchHomeProfile } from '../api/home-api';

const respond = (status: number, body: unknown) => ({
  request: async () => ({ status, body }),
});

describe('fetchHomeProfile', () => {
  // Regression: the dashboard showed 0 Carbon Units, an empty greeting name and
  // a spurious verify-email prompt because this parsed the `{ data: ... }`
  // envelope instead of its contents. Every schema field is optional, so the
  // parse succeeded and the failure was invisible.
  it('reads the user out of the { data } envelope the API returns', async () => {
    const http = respond(200, {
      data: {
        firstName: 'Ada',
        carbonUnits: 1234.7,
        isEmailVerified: true,
        phoneNumber: '+2348012345678',
      },
    });

    await expect(fetchHomeProfile(http)).resolves.toEqual({
      firstName: 'Ada',
      carbonUnits: 1234.7,
      isEmailVerified: true,
      phoneNumber: '+2348012345678',
      ready: true,
    });
  });

  it('still reads an unwrapped body', async () => {
    const http = respond(200, { firstName: 'Ada', carbonUnits: 10 });
    const profile = await fetchHomeProfile(http);
    expect(profile.carbonUnits).toBe(10);
    expect(profile.firstName).toBe('Ada');
  });

  it('coerces a string carbonUnits, as the API sometimes sends', async () => {
    const http = respond(200, { data: { carbonUnits: '842.5' } });
    await expect(fetchHomeProfile(http)).resolves.toMatchObject({
      carbonUnits: 842.5,
    });
  });

  it('reports not-ready on a non-2xx instead of a zeroed profile', async () => {
    const http = respond(500, { data: { carbonUnits: 999 } });
    await expect(fetchHomeProfile(http)).resolves.toMatchObject({
      carbonUnits: 0,
      ready: false,
    });
  });

  it('defaults a missing carbonUnits to 0', async () => {
    const http = respond(200, { data: { firstName: 'Ada' } });
    await expect(fetchHomeProfile(http)).resolves.toMatchObject({
      carbonUnits: 0,
      ready: true,
    });
  });
});

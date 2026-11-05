import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { HomeScreen } from '@/features/home';
import { renderWithProviders } from '@/test/render';

function afternoonClock() {
  return { now: () => new Date('2026-08-19T15:00:00') };
}

describe('HomeScreen', () => {
  it("shows a guest the meter's register line and the start-scanning card, with no profile", async () => {
    let profileCalls = 0;
    const request = jest.fn(async ({ path }: { path: string }) => {
      if (path === '/profile') profileCalls += 1;
      return { status: 200, body: { ok: true } };
    });
    await renderWithProviders(<HomeScreen guest />, {
      ports: { http: { request }, clock: afternoonClock() },
    });

    await waitFor(() => expect(screen.getByTestId('home-meter')).toBeTruthy());
    expect(screen.getByText('Register to start saving Carbon Units')).toBeTruthy();
    expect(screen.getByText('start scanning')).toBeTruthy();
    expect(screen.getByText('to see expiring items')).toBeTruthy();
    expect(screen.queryByText('Verify your email')).toBeNull();
    expect(profileCalls).toBe(0);
  });

  it('counts all Carbon Units and finds a drop-off from a picked material', async () => {
    const navigate = jest.fn();
    const request = jest.fn(async ({ path }: { path: string }) => {
      if (path === '/profile') {
        return {
          status: 200,
          body: {
            firstName: 'Ada',
            carbonUnits: 12,
            homeCarbonUnits: 3,
            isEmailVerified: true,
            phoneNumber: '555',
          },
        };
      }
      if (path === '/materials/primary-types') {
        return { status: 200, body: { data: { primaryTypes: ['Food'] } } };
      }
      return { status: 200, body: [] };
    });

    await renderWithProviders(<HomeScreen />, {
      ports: {
        http: { request },
        navigation: { navigate, replace() {}, back() {} },
        clock: afternoonClock(),
      },
    });

    await waitFor(() => expect(screen.getByText('Carbon Units')).toBeTruthy());
    expect(screen.getByText('select material for options')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('home-material-Food'));
    await fireEvent.press(screen.getByText('Find where'));
    expect(navigate).toHaveBeenCalledWith('/where?type=Food');
  });

  it("puts the food card first with the member's expiring groceries, and opens DiVA on them", async () => {
    const navigate = jest.fn();
    const soon = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const request = jest.fn(async ({ path }: { path: string }) => {
      if (path === '/profile') {
        return { status: 200, body: { firstName: 'Ada', carbonUnits: 1, isEmailVerified: true, phoneNumber: '1' } };
      }
      if (path.startsWith('/grocery/items')) {
        return {
          status: 200,
          body: { data: [{ _id: 'g1', name: 'kiwi', expiresOn: soon, status: 'active' }] },
        };
      }
      return { status: 200, body: [] };
    });
    await renderWithProviders(<HomeScreen />, {
      ports: { http: { request }, navigation: { navigate, replace() {}, back() {} }, clock: afternoonClock() },
    });
    await waitFor(() => expect(screen.getByText('expiring food?')).toBeTruthy());
    expect(screen.getByText('select grocery for options')).toBeTruthy();
    expect(screen.getByText('1 item is expiring')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('home-grocery-g1'));
    await fireEvent.press(screen.getAllByTestId('home-ask-diva')[0]!);
    expect(navigate).toHaveBeenCalledWith('/ai');
  });

  it('asks a guest to sign in before asking DiVA', async () => {
    const onRequireSignIn = jest.fn();
    const navigate = jest.fn();
    await renderWithProviders(<HomeScreen guest onRequireSignIn={onRequireSignIn} />, {
      ports: {
        http: { request: async () => ({ status: 200, body: [] }) },
        navigation: { navigate, replace() {}, back() {} },
        clock: afternoonClock(),
      },
    });
    await waitFor(() => expect(screen.getByTestId('home-ask-send')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('home-ask-send'));
    expect(onRequireSignIn).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalledWith('/ai');
  });

  it('opens the Where map and Events from the apps row', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<HomeScreen />, {
      ports: {
        http: { request: async () => ({ status: 200, body: [] }) },
        navigation: { navigate, replace() {}, back() {} },
        clock: afternoonClock(),
      },
    });
    await waitFor(() => expect(screen.getByTestId('home-app-where')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('home-app-where'));
    expect(navigate).toHaveBeenCalledWith('/where');
    await fireEvent.press(screen.getByTestId('home-app-events'));
    expect(navigate).toHaveBeenCalledWith('/campaigns');
  });

  it('offers email verification when the profile is unverified', async () => {
    const navigate = jest.fn();
    const request = jest.fn(async ({ path }: { path: string }) => {
      if (path === '/profile') {
        return {
          status: 200,
          body: {
            firstName: 'Ada',
            carbonUnits: 0,
            isEmailVerified: false,
            phoneNumber: '1',
          },
        };
      }
      if (path === '/auth/request-otp')
        return { status: 200, body: { ok: true } };
      return { status: 200, body: [] };
    });

    await renderWithProviders(<HomeScreen />, {
      ports: {
        http: { request },
        navigation: { navigate, replace() {}, back() {} },
        clock: afternoonClock(),
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Verify your email')).toBeTruthy();
    });
    await fireEvent.press(screen.getByText('Verify Email Now →'));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/verify-email');
    });
  });
});

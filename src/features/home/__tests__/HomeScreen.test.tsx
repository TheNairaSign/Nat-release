import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { HomeScreen } from '@/features/home';
import { renderWithProviders } from '@/test/render';

function afternoonClock() {
  return { now: () => new Date('2026-08-19T15:00:00') };
}

describe('HomeScreen', () => {
  it('shows guest copy and fallback chips without fetching a profile', async () => {
    let profileCalls = 0;
    const request = jest.fn(async ({ path }: { path: string }) => {
      if (path === '/profile') profileCalls += 1;
      return { status: 200, body: { ok: true } };
    });
    await renderWithProviders(<HomeScreen guest />, {
      ports: {
        http: { request },
        clock: afternoonClock(),
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Green Impact')).toBeTruthy();
    });
    expect(
      screen.getByText('Register to start saving Carbon Units'),
    ).toBeTruthy();
    expect(screen.getByText('Good Afternoon there!')).toBeTruthy();
    expect(screen.queryByText('Verify your email')).toBeNull();
    expect(profileCalls).toBe(0);
  });

  it('shows carbon units and finds a drop-off from a selected chip', async () => {
    const navigate = jest.fn();
    const request = jest.fn(async ({ path }: { path: string }) => {
      if (path === '/profile') {
        return {
          status: 200,
          body: {
            firstName: 'Ada',
            carbonUnits: 12,
            isEmailVerified: true,
            phoneNumber: '555',
          },
        };
      }
      if (path === '/materials/primary-types') {
        return { status: 200, body: { data: { primaryTypes: ['Food'] } } };
      }
      if (path.includes('suggestions')) {
        return {
          status: 200,
          body: {
            success: true,
            data: [{ _id: 's1', text: 'How do I compost?' }],
          },
        };
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

    await waitFor(() => {
      expect(screen.getByText('Carbon Units')).toBeTruthy();
      expect(screen.getByText('Good Afternoon Ada!')).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('home-chip-Food'));
    await fireEvent.press(screen.getByTestId('home-find-where'));
    expect(navigate).toHaveBeenCalledWith('/where?type=Food');

    await fireEvent.press(screen.getByTestId('home-open-chat'));
    expect(navigate).toHaveBeenCalledWith('/ai');
  });

  it('asks a guest to sign in before opening AI', async () => {
    const onRequireSignIn = jest.fn();
    const navigate = jest.fn();
    await renderWithProviders(
      <HomeScreen guest onRequireSignIn={onRequireSignIn} />,
      {
        ports: {
          http: { request: async () => ({ status: 200, body: [] }) },
          navigation: { navigate, replace() {}, back() {} },
          clock: afternoonClock(),
        },
      },
    );
    await waitFor(() => {
      expect(screen.getByTestId('home-open-chat')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('home-open-chat'));
    expect(onRequireSignIn).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalledWith('/ai');
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

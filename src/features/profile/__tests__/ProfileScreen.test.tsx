import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ProfileScreen } from '@/features/profile';
import { renderWithProviders } from '@/test/render';

function httpForProfile() {
  return {
    request: async ({ path }: { path: string }) => {
      if (path === '/profile') {
        return {
          status: 200,
          body: {
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@example.com',
            pointsEarned: 40,
            carbonUnits: 12.5,
          },
        };
      }
      if (path === '/allowance/me') {
        return {
          status: 200,
          body: {
            data: {
              enabled: true,
              tier: 'free',
              tierName: 'Freemium',
              tokens: { used: 320, total: 1000, left: 680, extra: 0 },
              kinds: [],
            },
          },
        };
      }
      return { status: 200, body: {} };
    },
  };
}

describe('ProfileScreen', () => {
  it('shows activity rows and navigates', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<ProfileScreen />, {
      ports: {
        http: httpForProfile(),
        navigation: { navigate, replace() {}, back() {} },
      },
    });
    await waitFor(() => {
      expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('profile-dropoffs'));
    expect(navigate).toHaveBeenCalledWith('/dropoff/all');
    await fireEvent.press(screen.getByTestId('profile-impact'));
    expect(navigate).toHaveBeenCalledWith('/impact');
  });

  it('shows tokens used on the CU card, and no NatPoints or Rewards', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<ProfileScreen />, {
      ports: {
        http: httpForProfile(),
        navigation: { navigate, replace() {}, back() {} },
      },
    });
    await waitFor(() => {
      expect(screen.getByText('TK used')).toBeTruthy();
    });
    expect(screen.getByText('12.5 CU')).toBeTruthy();
    expect(screen.queryByText('NatPoints')).toBeNull();
    expect(screen.queryByText('Rewards')).toBeNull();
    await fireEvent.press(screen.getByTestId('profile-tokens'));
    expect(navigate).toHaveBeenCalledWith('/tokens');
  });
});

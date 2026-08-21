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
});

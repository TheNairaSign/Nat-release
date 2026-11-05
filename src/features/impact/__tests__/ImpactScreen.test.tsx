import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ImpactScreen } from '@/features/impact';
import { renderWithProviders } from '@/test/render';
import { useSessionStore } from '@/features/auth';

function httpForImpact() {
  return {
    request: async ({ path }: { path: string }) => {
      if (path === '/profile') {
        return {
          status: 200,
          body: {
            firstName: 'Ada',
            lastName: 'Lovelace',
            carbonUnits: 8,
            homeCarbonUnits: 3.6,
            createdAt: '2024-01-01',
          },
        };
      }
      if (path.includes('/dropOff/user/')) {
        return {
          status: 200,
          body: {
            data: [
              {
                _id: 'd1',
                itemType: 'plastic',
                itemQuantity: 2,
                createdAt: '2026-01-02',
              },
            ],
          },
        };
      }
      if (path.includes('simple-dropoffs'))
        return { status: 200, body: { data: [] } };
      if (path.includes('primary-types'))
        return { status: 200, body: { data: { primaryTypes: ['plastic'] } } };
      if (path === '/materials') {
        return {
          status: 200,
          body: {
            data: {
              materials: [{ category: 'plastic', cuValue: 1, isActive: true }],
            },
          },
        };
      }
      if (path === '/home-diversion') {
        return {
          status: 200,
          body: {
            data: {
              food: 4,
              things: 1,
              packaging: 0,
              total: 5,
              cu: 3.6,
              byMaterial: { organics: { items: 4, cu: 2.6 }, others: { items: 1, cu: 1 } },
            },
          },
        };
      }
      return { status: 200, body: {} };
    },
  };
}

describe('ImpactScreen', () => {
  it('opens contributions from See all', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<ImpactScreen />, {
      ports: {
        http: httpForImpact(),
        navigation: { navigate, replace() {}, back() {} },
      },
    });
    useSessionStore.setState({
      session: { token: 't', userId: 'u1' },
      hydrated: true,
    });
    await waitFor(() => {
      expect(screen.getByText('Material Breakdown')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('impact-see-all'));
    expect(navigate).toHaveBeenCalledWith('/material-contributions');
  });

  it('counts home diversion in the pill and the breakdown, as web does', async () => {
    await renderWithProviders(<ImpactScreen />, { ports: { http: httpForImpact() } });
    useSessionStore.setState({
      session: { token: 't', userId: 'u1' },
      hydrated: true,
    });
    await waitFor(() => expect(screen.getByText('home diversion')).toBeTruthy());
    // 8 from drop-offs + 3.6 from home, floored.
    await waitFor(() => expect(screen.getByText('11')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('Organics')).toBeTruthy());
    expect(screen.queryByText('events')).toBeNull();
  });
});

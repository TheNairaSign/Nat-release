import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { WhereScreen } from '@/features/where';
import { renderWithProviders } from '@/test/render';

const origin = { latitude: 6.5244, longitude: 3.3792 };

function httpForWhere(onReminder?: jest.Mock) {
  return {
    request: async ({ path }: { path: string; method?: string }) => {
      if (path === '/materials/primary-types') {
        return {
          status: 200,
          body: { data: { primaryTypes: ['Food', 'plastic'] } },
        };
      }
      if (path.includes('/reminder')) {
        onReminder?.();
        return { status: 200, body: { ok: true } };
      }
      if (path.includes('simple-dropoff-locations/nearby')) {
        return {
          status: 200,
          body: {
            data: [
              {
                id: 'simple-1',
                name: 'Market bin',
                address: 'Lagos',
                record: true,
                bulkMaterialTypes: ['Food'],
                location: { coordinates: [3.38, 6.53] },
              },
            ],
          },
        };
      }
      if (path.includes('dropOff-location/nearest')) {
        return {
          status: 200,
          body: {
            data: [
              {
                _id: 'center-1',
                name: 'Recycling center',
                itemType: 'plastic',
                location: { coordinates: [3.37, 6.52] },
              },
            ],
          },
        };
      }
      if (path.includes('campaigns/map') || path.includes('campaigns/nearby')) {
        return {
          status: 200,
          body: {
            data: [
              {
                _id: 'c1',
                name: 'Community drive',
                status: 'active',
                location: { coordinates: [3.381, 6.531] },
              },
              {
                _id: 'c2',
                name: 'School fair',
                status: 'active',
                location: { coordinates: [3.382, 6.532] },
              },
            ],
          },
        };
      }
      return { status: 200, body: [] };
    },
  };
}

const locationPort = {
  requestPermission: async () => true,
  getCurrentPosition: async () => origin,
};

describe('WhereScreen', () => {
  it('shows diversion chrome and applies a type query to chips', async () => {
    await renderWithProviders(<WhereScreen type="Food" />, {
      ports: { http: httpForWhere(), location: locationPort },
    });
    await waitFor(() => {
      expect(screen.getByText('Diversion Points')).toBeTruthy();
      expect(screen.getByText('Diversion Events')).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByTestId('where-chip-Food')).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByText('2 events')).toBeTruthy();
    });
  });

  it('records a simple location with type, mode, and locationId', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<WhereScreen />, {
      ports: {
        http: httpForWhere(),
        location: locationPort,
        navigation: { navigate, replace() {}, back() {} },
      },
    });
    await waitFor(() => {
      expect(screen.getByTestId('where-place-simple-1')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('where-place-simple-1'));
    await fireEvent.press(screen.getByTestId('where-record'));
    expect(navigate).toHaveBeenCalledWith(
      '/dropoff/create?type=Food&mode=simple&locationId=simple-1',
    );
  });

  it('locks Record for guests', async () => {
    const onRequireSignIn = jest.fn();
    const navigate = jest.fn();
    await renderWithProviders(
      <WhereScreen guest onRequireSignIn={onRequireSignIn} />,
      {
        ports: {
          http: httpForWhere(),
          location: locationPort,
          navigation: { navigate, replace() {}, back() {} },
        },
      },
    );
    await waitFor(() => {
      expect(screen.getByTestId('where-place-center-1')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('where-place-center-1'));
    await fireEvent.press(screen.getByTestId('where-record'));
    expect(onRequireSignIn).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('opens directions for the selected place', async () => {
    const openUrl = jest.fn(async () => undefined);
    await renderWithProviders(<WhereScreen />, {
      ports: {
        http: httpForWhere(),
        location: locationPort,
        linking: { openUrl },
      },
    });
    await waitFor(() => {
      expect(screen.getByTestId('where-place-center-1')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('where-place-center-1'));
    await fireEvent.press(screen.getByTestId('where-directions'));
    expect(openUrl).toHaveBeenCalled();
  });

  it('emails a reminder for a campaign', async () => {
    const onReminder = jest.fn();
    await renderWithProviders(<WhereScreen />, {
      ports: { http: httpForWhere(onReminder), location: locationPort },
    });
    await fireEvent.press(await screen.findByTestId('where-events-card'));
    await waitFor(() => {
      expect(screen.getByTestId('where-place-c1')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('where-place-c1'));
    await fireEvent.press(screen.getByTestId('where-reminder'));
    await waitFor(() => {
      expect(onReminder).toHaveBeenCalled();
    });
  });

  it('locks event reminders for guests', async () => {
    const onRequireSignIn = jest.fn();
    await renderWithProviders(
      <WhereScreen guest onRequireSignIn={onRequireSignIn} />,
      {
        ports: { http: httpForWhere(), location: locationPort },
      },
    );
    await fireEvent.press(await screen.findByTestId('where-events-card'));
    await waitFor(() => {
      expect(screen.getByTestId('where-place-c1')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('where-place-c1'));
    await fireEvent.press(screen.getByTestId('where-reminder'));
    expect(onRequireSignIn).toHaveBeenCalledWith('reminder');
  });
});

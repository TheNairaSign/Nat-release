import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { CreateDropoffScreen } from '@/features/dropoff';
import { renderWithProviders } from '@/test/render';

function httpForCreate() {
  return {
    request: async ({ path }: { path: string }) => {
      if (path.includes('simple-dropoff-locations')) {
        return {
          status: 200,
          body: {
            data: [
              {
                id: 'loc-1',
                name: 'Market bin',
                record: true,
                bulkMaterialTypes: ['plastic'],
                location: { coordinates: [3.38, 6.53] },
              },
            ],
          },
        };
      }
      if (path.includes('simple-dropoffs')) {
        return { status: 200, body: { cuEarned: 1.2 } };
      }
      return { status: 200, body: { data: [] } };
    },
  };
}

describe('CreateDropoffScreen', () => {
  it('logs a static drop-off and returns home', async () => {
    const navigate = jest.fn();
    const set = jest.fn();
    await renderWithProviders(
      <CreateDropoffScreen type="plastic" mode="simple" locationId="loc-1" />,
      {
        ports: {
          http: httpForCreate(),
          navigation: { navigate, replace() {}, back() {} },
          location: {
            requestPermission: async () => true,
            getPermissionStatus: async () => 'granted' as const,
            getCurrentPosition: async () => ({ latitude: 6.5, longitude: 3.3 }),
          },
          camera: {
            requestPermission: async () => true,
            takePhoto: async () => ({
              uri: 'file://proof.jpg',
              fileName: 'proof.jpg',
              mimeType: 'image/jpeg',
              base64: 'abc',
            }),
            pickImage: async () => null,
          },
          kv: { get: async () => null, set, remove: async () => undefined },
        },
      },
    );
    await waitFor(() => {
      expect(screen.getByTestId('site-loc-1')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('site-loc-1'));
    await waitFor(() => {
      expect(screen.getByTestId('qty-plastic')).toBeTruthy();
    });
    fireEvent.changeText(screen.getByTestId('qty-plastic'), '2');
    await fireEvent.press(screen.getByTestId('take-photo'));
    await fireEvent.press(screen.getByTestId('log-dropoff-submit'));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/home');
    });
    expect(set).toHaveBeenCalled();
  });
});

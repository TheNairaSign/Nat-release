import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SavedPlacesScreen } from '@/features/where';
import { renderWithProviders } from '@/test/render';

const ROWS = [
  { _id: 's1', targetType: 'campaign', targetId: 'c1', targetName: 'Community drive', createdAt: '2026-11-10T10:00:00.000Z' },
  { _id: 's2', targetType: 'location', targetId: 'l1', targetName: 'Market bin', createdAt: '2026-11-09T10:00:00.000Z' },
];

function http(rows: object[] = ROWS) {
  const calls: { path: string; method?: string }[] = [];
  return {
    calls,
    port: {
      request: async (call: { path: string; method?: string }) => {
        calls.push(call);
        if (call.method === 'DELETE') return { status: 200, body: { data: null } };
        return { status: 200, body: { data: rows } };
      },
    },
  };
}

describe('SavedPlacesScreen', () => {
  it('lists saved places and opens each on WHERE', async () => {
    const navigate = jest.fn();
    const { port } = http();
    await renderWithProviders(<SavedPlacesScreen />, {
      ports: { http: port, navigation: { navigate, replace() {}, back() {} } },
    });
    await waitFor(() => expect(screen.getByText('Community drive')).toBeTruthy());
    expect(screen.getByText('Market bin')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('saved-place-c1'));
    expect(navigate).toHaveBeenCalledWith('/where?eventId=c1');
    await fireEvent.press(screen.getByTestId('saved-place-l1'));
    expect(navigate).toHaveBeenCalledWith('/where?locationId=l1');
  });

  it('removes one with its heart', async () => {
    const { port, calls } = http();
    await renderWithProviders(<SavedPlacesScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByText('Market bin')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('saved-place-remove-l1'));
    await waitFor(() =>
      expect(calls.some((c) => c.method === 'DELETE' && c.path === '/saved-places/location/l1')).toBe(true),
    );
  });

  it('points to WHERE when nothing is saved', async () => {
    const { port } = http([]);
    await renderWithProviders(<SavedPlacesScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByText('Nothing saved yet')).toBeTruthy());
  });
});

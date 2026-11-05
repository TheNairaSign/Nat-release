import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { WasteAppsScreen } from '@/features/waste-apps';
import { renderWithProviders } from '@/test/render';

describe('WasteAppsScreen', () => {
  it('lists the six apps and opens them', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<WasteAppsScreen />, {
      ports: { navigation: { navigate, replace() {}, back() {} } },
    });
    await waitFor(() => expect(screen.getByText('WasteApps')).toBeTruthy());
    for (const id of ['grocery', 'thingsmatch', 'diva', 'where', 'events', 'snapdivert']) {
      expect(screen.getByTestId(`waste-app-${id}`)).toBeTruthy();
    }
    await fireEvent.press(screen.getByTestId('waste-app-grocery'));
    expect(navigate).toHaveBeenCalledWith('/ai/grocery');
    await fireEvent.press(screen.getByTestId('waste-app-snapdivert'));
    expect(navigate).toHaveBeenCalledWith('/snapdivert');
  });

  it("sends a guest to the guest scanners, and asks them to sign in for the rest", async () => {
    const navigate = jest.fn();
    await renderWithProviders(<WasteAppsScreen guest />, {
      ports: { navigation: { navigate, replace() {}, back() {} } },
    });
    await waitFor(() => expect(screen.getByTestId('waste-app-grocery')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('waste-app-grocery'));
    expect(navigate).toHaveBeenCalledWith('/guest/ai/grocery');
    await fireEvent.press(screen.getByTestId('waste-app-events'));
    expect(navigate).not.toHaveBeenCalledWith('/campaigns');
  });
});

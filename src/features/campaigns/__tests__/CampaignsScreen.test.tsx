import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { CampaignsScreen } from '@/features/campaigns';
import { renderWithProviders } from '@/test/render';

const EVENTS = [
  { _id: 'e1', name: 'Bike swap day', description: 'Old bikes', materialTypes: ['bicycles'], goal: 0, progress: 0, endDate: '2026-12-13' },
  { _id: 'e2', name: 'Bottle drive', description: 'Bottles', materialTypes: ['plastic'], goal: 100, progress: 40, endDate: '2026-12-20' },
];

const http = {
  request: async () => ({ status: 200, body: { data: EVENTS } }),
};

describe('CampaignsScreen', () => {
  it('is called Events and opens the events part of Where', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<CampaignsScreen />, {
      ports: { http, navigation: { navigate, replace() {}, back() {} } },
    });
    await waitFor(() => expect(screen.getByText('Bike swap day')).toBeTruthy());
    expect(screen.getByText('Events')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('campaigns-view-on-map'));
    expect(navigate).toHaveBeenCalledWith('/where?focus=events');
  });

  it('opens an event on the map with its card, as web does', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<CampaignsScreen />, {
      ports: { http, navigation: { navigate, replace() {}, back() {} } },
    });
    await waitFor(() => expect(screen.getByTestId('campaign-e1')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('campaign-e1'));
    expect(navigate).toHaveBeenCalledWith('/where?focus=events&eventId=e1');
  });

  it('shows progress only for an event with a goal', async () => {
    await renderWithProviders(<CampaignsScreen />, { ports: { http } });
    await waitFor(() => expect(screen.getByText('Bottle drive')).toBeTruthy());
    expect(screen.getAllByText('Progress')).toHaveLength(1);
    expect(screen.getByText('40%')).toBeTruthy();
  });
});

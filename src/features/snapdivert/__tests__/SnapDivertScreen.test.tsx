import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SnapDivertHistoryScreen, SnapDivertScreen } from '@/features/snapdivert';
import { renderWithProviders } from '@/test/render';

// A jest.mock factory can't use the file's imports, so it requires its own.
/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@/shared/ui/CameraViewfinder', () => {
  const React = require('react');
  const { View } = require('react-native');
  const photo = { base64: 'abc', mimeType: 'image/jpeg', uri: 'file://snap.jpg' };
  return {
    preparePhoto: async () => photo,
    CameraViewfinder: React.forwardRef(function Fake(_props: object, ref: unknown) {
      React.useImperativeHandle(ref, () => ({ capture: async () => photo }));
      return React.createElement(View, { testID: 'fake-viewfinder' });
    }),
  };
});
/* eslint-enable @typescript-eslint/no-require-imports */

const KEPT = [
  { _id: 's1', snapId: 'p1', imageUrl: 'https://img/snap.jpg', tag: 1, box: { xMin: 0.1, yMin: 0.1, xMax: 0.4, yMax: 0.4 }, name: 'chair', material: 'wood', condition: null, status: 'pending', settledAt: null, createdAt: '' },
  { _id: 's2', snapId: 'p1', imageUrl: 'https://img/snap.jpg', tag: 2, box: { xMin: 0.5, yMin: 0.5, xMax: 0.8, yMax: 0.8 }, name: 'lamp', material: 'metal', condition: 'good', status: 'diverted', settledAt: null, createdAt: '' },
];

type Call = { path: string; method?: string; body?: unknown };

function http() {
  const calls: Call[] = [];
  return {
    calls,
    port: {
      request: async (call: Call) => {
        calls.push(call);
        const { path } = call;
        if (path === '/snapdivert/session') {
          return { status: 200, body: { data: { upload: { url: 'https://cloud/upload', fields: {} }, ml: { baseUrl: 'https://ml', token: 't', expiresAt: '' } } } };
        }
        if (path === 'https://cloud/upload') return { status: 200, body: { secure_url: 'https://img/snap.jpg' } };
        if (path === 'https://ml/v1/snaps/identify') {
          return { status: 200, body: { items: [{ tag: 1, label: 'chair', material: 'wood', box: { x_min: 0.1, y_min: 0.1, x_max: 0.4, y_max: 0.4 } }] } };
        }
        if (path === '/snapdivert/snaps') return { status: 200, body: { data: { snapId: 'p1', items: [KEPT[0]] } } };
        if (path === '/snapdivert/items') return { status: 200, body: { data: KEPT } };
        if (path === '/snapdivert/stats') return { status: 200, body: { data: { days: 30, diverted: 3, disposed: 1, savedShare: 0.75 } } };
        return { status: 200, body: {} };
      },
    },
  };
}

describe('SnapDivert', () => {
  it('snaps, names what is there, and keeps a condition', async () => {
    const { port, calls } = http();
    await renderWithProviders(<SnapDivertScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByText('Show what you are disposing')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('snap-shutter'));
    await waitFor(() => expect(screen.getByTestId('snap-item-1')).toBeTruthy());
    expect(screen.getByText('How to divert it?')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('snap-condition-1-repair'));
    await waitFor(() =>
      expect(calls.some((c) => c.method === 'PATCH' && (c.body as { condition?: string }).condition === 'repair')).toBe(true),
    );
  });

  it("History shows the last 30 days and what's still to settle", async () => {
    const { port } = http();
    await renderWithProviders(<SnapDivertHistoryScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByTestId('snap-stats')).toBeTruthy());
    expect(screen.getByText('75% saved')).toBeTruthy();
    expect(screen.getByText('chair')).toBeTruthy();
    expect(screen.queryByText('lamp')).toBeNull(); // already settled
    await fireEvent.press(screen.getByTestId('snap-tab-history'));
    expect(screen.getByText('lamp')).toBeTruthy();
    // The row's status, beside the swipe layer's own "Diverted" behind it.
    expect(screen.getAllByText('Diverted').length).toBeGreaterThan(1);
  });
});

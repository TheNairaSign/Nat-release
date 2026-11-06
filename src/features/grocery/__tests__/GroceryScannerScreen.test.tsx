import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { GroceryScannerScreen } from '@/features/grocery';
import { renderWithProviders } from '@/test/render';

// The camera is native: a viewfinder that hands back a ready photo.
// A jest.mock factory can't use the file's imports, so it requires its own.
/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@/shared/ui/CameraViewfinder', () => {
  const React = require('react');
  const { View } = require('react-native');
  const photo = { base64: 'abc', mimeType: 'image/jpeg', uri: 'file://cart.jpg' };
  return {
    preparePhoto: async () => photo,
    CameraViewfinder: React.forwardRef(function Fake(_props: object, ref: unknown) {
      React.useImperativeHandle(ref, () => ({ capture: async () => photo }));
      return React.createElement(View, { testID: 'fake-viewfinder' });
    }),
  };
});
/* eslint-enable @typescript-eslint/no-require-imports */

const ITEM = {
  tag: 1,
  tags: [1],
  quantity: 1,
  merged_into: null,
  box: { x_min: 0.1, y_min: 0.1, x_max: 0.3, y_max: 0.3 },
  label: null,
  suggested_label: null,
  expiry: { expires_on: '2026-12-01', source: 'printed', confidence: 0.9 },
};

const cart = (over: object) => ({
  id: 'cart1',
  status: 'awaiting_answers',
  image_url: 'https://img/cart.jpg',
  items: [ITEM],
  open_questions: [{ tag: 1, kind: 'label', hint: null }],
  confirmed: false,
  failure_reason: null,
  updated_at: '1',
  ...over,
});

type Call = { path: string; method?: string; body?: unknown; token?: string | null };

function http(sessionStatus = 200) {
  const calls: Call[] = [];
  return {
    calls,
    port: {
      request: async (call: Call) => {
        calls.push(call);
        const { path, method } = call;
        if (path === '/grocery/scan-session') {
          if (sessionStatus === 429) {
            return {
              status: 429,
              body: { code: 'allowance_used_up', kind: 'groceryScan', message: 'A grocery scan takes 100 TK and you have 20 left.' },
            };
          }
          return {
            status: 200,
            body: { data: { upload: { url: 'https://cloud/upload', fields: { sig: 'x' } }, ml: { baseUrl: 'https://ml', token: 'mltoken', expiresAt: '' } } },
          };
        }
        if (path === 'https://cloud/upload') return { status: 200, body: { secure_url: 'https://img/cart.jpg' } };
        if (path === 'https://ml/v1/scans') return { status: 200, body: cart({ status: 'processing' }) };
        if (path === 'https://ml/v1/carts/cart1' && method !== 'PATCH') return { status: 200, body: cart({}) };
        if (path === 'https://ml/v1/carts/cart1/items/1') {
          return { status: 200, body: cart({ status: 'ready', open_questions: [], items: [{ ...ITEM, label: 'milk' }] }) };
        }
        if (path === 'https://ml/v1/carts/cart1/finalize') {
          return { status: 200, body: cart({ status: 'finalized', open_questions: [], items: [{ ...ITEM, label: 'milk' }] }) };
        }
        if (path.startsWith('/grocery/items')) return { status: 200, body: { data: [] } };
        return { status: 200, body: {} };
      },
    },
  };
}

describe('GroceryScannerScreen', () => {
  it('scans a photo, asks about what it is unsure of, and saves the list', async () => {
    const { port, calls } = http();
    await renderWithProviders(<GroceryScannerScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByText('What did you get today?')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('scanner-shutter'));

    await waitFor(() => expect(screen.getByText('What is number 1?')).toBeTruthy());
    // The ML calls carry the scan's own token.
    expect(calls.find((c) => c.path === 'https://ml/v1/scans')?.token).toBe('mltoken');

    await fireEvent.press(screen.getByTestId('scanner-question'));
    await fireEvent.changeText(screen.getByTestId('scanner-input'), 'milk');
    await fireEvent(screen.getByTestId('scanner-input'), 'submitEditing');

    await waitFor(() => expect(screen.getByText('1 item added to your list')).toBeTruthy());
    const rename = calls.find((c) => c.method === 'PATCH');
    expect(rename?.body).toEqual({ label: 'milk' });
  });

  it('says when the tokens have run out, and offers more', async () => {
    const { port } = http(429);
    const navigate = jest.fn();
    await renderWithProviders(<GroceryScannerScreen />, {
      ports: { http: port, navigation: { navigate, replace() {}, back() {} } },
    });
    await waitFor(() => expect(screen.getByTestId('scanner-shutter')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('scanner-shutter'));
    await waitFor(() => expect(screen.getByText('Not enough tokens')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('scanner-error-second'));
    expect(navigate).toHaveBeenCalledWith('/tokens');
  });
});

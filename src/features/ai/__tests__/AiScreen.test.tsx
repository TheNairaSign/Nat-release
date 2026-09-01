import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AiScreen } from '@/features/ai';
import { renderWithProviders } from '@/test/render';

function httpForAi() {
  return {
    request: async ({ path }: { path: string }) => {
      if (path === '/profile') {
        return { status: 200, body: { firstName: 'Ada' } };
      }
      if (path.includes('/suggestions')) {
        return {
          status: 200,
          body: { data: [{ _id: 's1', text: 'Where can I recycle plastic?' }] },
        };
      }
      if (path.includes('/ask')) {
        return {
          status: 200,
          body: {
            type: 'AGENTIC',
            data: {
              answer: 'Open the Where tab.',
              tools: [{ name: 'navigateTo', parameters: { route: '/where' } }],
            },
          },
        };
      }
      if (path === '/chat') return { status: 200, body: { data: [] } };
      return { status: 200, body: {} };
    },
  };
}

describe('AiScreen', () => {
  it('opens chat from a capability and navigates tools', async () => {
    const navigate = jest.fn();
    await renderWithProviders(<AiScreen />, {
      ports: {
        http: httpForAi(),
        navigation: { navigate, replace() {}, back() {} },
      },
    });
    await waitFor(() => {
      expect(screen.getByText(/what diversion questions/i)).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('ai-cap-recycling'));
    await waitFor(() => {
      expect(screen.getByText('Open the Where tab.')).toBeTruthy();
    });
    // Tools are grouped into actions, so the testID is the group id and the
    // label comes from getContinueLabel — "/where" maps to "Find nearby".
    await fireEvent.press(screen.getByTestId('ai-tool-find_where'));
    expect(navigate).toHaveBeenCalledWith('/where');
  });
});

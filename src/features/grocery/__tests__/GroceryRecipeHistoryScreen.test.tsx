import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { GroceryRecipeHistoryScreen } from '@/features/grocery';
import { renderWithProviders } from '@/test/render';

type Call = { path: string; method?: string };

const RECIPE_MESSAGES = [
  {
    _id: 'm1',
    text: "Here's a stir-fry",
    sender: 'ai',
    timestamp: '2026-11-01T10:00:00.000Z',
    recipe: { title: 'Kale stir-fry', uses: ['kale', 'carrot'], minutes: 15, steps: ['Chop it', 'Fry it'], tip: 'Add soy sauce' },
  },
  {
    _id: 'm2',
    text: 'And a soup',
    sender: 'ai',
    timestamp: '2026-11-03T10:00:00.000Z',
    recipe: { title: 'Carrot soup', uses: ['carrot'], minutes: 20, steps: ['Boil it'], tip: null },
  },
  { _id: 'm3', text: 'How do I divert this?', sender: 'user', timestamp: '2026-11-02T10:00:00.000Z' },
];

function http(messages: unknown[] = RECIPE_MESSAGES) {
  const calls: Call[] = [];
  return {
    calls,
    port: {
      request: async (call: Call) => {
        calls.push(call);
        if (call.path.startsWith('/chat')) return { status: 200, body: { data: messages } };
        return { status: 200, body: {} };
      },
    },
  };
}

describe('GroceryRecipeHistoryScreen', () => {
  it("asks for the grocery section, newest recipe first, and skips messages without one", async () => {
    const { port, calls } = http();
    await renderWithProviders(<GroceryRecipeHistoryScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByText('Carrot soup')).toBeTruthy());
    expect(screen.getByText('Kale stir-fry')).toBeTruthy();
    expect(screen.queryByText('How do I divert this?')).toBeNull();
    expect(calls.some((c) => c.path === '/chat?section=grocery')).toBe(true);
    // Newest (Nov 3) renders before the older one (Nov 1).
    const titles = screen.getAllByText(/stir-fry|soup/);
    expect(titles[0]?.props.children).toBe('Carrot soup');
  });

  it('expands into the full recipe card on tap', async () => {
    const { port } = http();
    await renderWithProviders(<GroceryRecipeHistoryScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByText('Carrot soup')).toBeTruthy());
    await fireEvent.press(screen.getByText('Carrot soup'));
    await waitFor(() => expect(screen.getByText('Boil it')).toBeTruthy());
  });

  it('offers to ask DiVA for one when there are none yet', async () => {
    const navigate = jest.fn();
    const { port } = http([]);
    await renderWithProviders(<GroceryRecipeHistoryScreen />, {
      ports: { http: port, navigation: { navigate, replace() {}, back() {} } },
    });
    await waitFor(() => expect(screen.getByTestId('recipe-history-ask')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('recipe-history-ask'));
    expect(navigate).toHaveBeenCalledWith('/ai');
  });
});

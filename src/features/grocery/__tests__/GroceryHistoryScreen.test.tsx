import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { GroceryHistoryScreen } from '@/features/grocery';
import { renderWithProviders } from '@/test/render';

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const SCANS = [
  {
    cartId: 'c1',
    scannedAt: new Date().toISOString(),
    items: [
      { _id: 'i1', tag: 1, name: 'kiwi', expiresOn: day(2), status: 'active', packaging: null },
      { _id: 'i2', tag: 2, name: 'milk', expiresOn: day(9), status: 'active', packaging: { primaryType: 'plastic', subType: null, label: 'bottle' } },
      { _id: 'i3', tag: 3, name: 'bread', expiresOn: day(-1), status: 'consumed', packaging: null },
    ],
  },
];

type Call = { path: string; method?: string; body?: unknown };

function http() {
  const calls: Call[] = [];
  return {
    calls,
    port: {
      request: async (call: Call) => {
        calls.push(call);
        if (call.path === '/grocery/scans') return { status: 200, body: { data: SCANS } };
        if (call.path.endsWith('/ask')) {
          const question = (call.body as { question?: string }).question;
          // First the ideas for what's expiring, then the recipe for the one picked.
          return question === 'Kiwi smoothie'
            ? {
                status: 200,
                body: {
                  type: 'KNOWLEDGE',
                  data: {
                    answer: 'Here you go.',
                    recipe: { title: 'Kiwi smoothie', uses: ['kiwi', 'milk'], minutes: 5, steps: ['Blend'], tip: null },
                  },
                },
              }
            : {
                status: 200,
                body: {
                  type: 'CLARIFICATION',
                  data: {
                    question: 'Which one?',
                    context: { useUp: { ideas: [{ title: 'Kiwi smoothie', uses: ['kiwi'], why: 'Quick' }] } },
                  },
                },
              };
        }
        if (call.path === '/chat' && call.method === 'POST') {
          return { status: 200, body: { data: [{ _id: 'saved-recipe' }] } };
        }
        if (call.path.startsWith('/grocery/stats')) {
          return { status: 200, body: { data: { used: 3, wasted: 1, savedShare: 0.75 } } };
        }
        if (call.method === 'PATCH') {
          const id = call.path.split('/').pop();
          const item = SCANS[0]!.items.find((i) => i._id === id)!;
          return { status: 200, body: { data: { ...item, ...(call.body as object) } } };
        }
        return { status: 200, body: {} };
      },
    },
  };
}

describe('GroceryHistoryScreen', () => {
  it("shows the 30-day summary and what's still to use, soonest first", async () => {
    const { port } = http();
    await renderWithProviders(<GroceryHistoryScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByTestId('grocery-stats')).toBeTruthy());
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('Diverted')).toBeTruthy();
    expect(screen.getByText('25%\nlandfilled')).toBeTruthy();
    expect(screen.getByText('kiwi')).toBeTruthy();
    expect(screen.getByText('milk')).toBeTruthy();
    expect(screen.queryByText('bread')).toBeNull(); // used: not in Expiring
  });

  it('History groups by shop and includes what was used', async () => {
    const { port } = http();
    await renderWithProviders(<GroceryHistoryScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByTestId('grocery-tab-history')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('grocery-tab-history'));
    expect(screen.getByText('bread')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('3 items')).toBeTruthy();
  });

  it('marks an item used from its sheet, with Undo and where the packaging goes', async () => {
    const { port, calls } = http();
    await renderWithProviders(<GroceryHistoryScreen />, { ports: { http: port } });
    await waitFor(() => expect(screen.getByText('milk')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('milk: more options'));
    await fireEvent.press(screen.getByTestId('grocery-action-used'));
    await waitFor(() => expect(screen.getByTestId('grocery-undo')).toBeTruthy());
    expect(screen.getByText('milk marked used')).toBeTruthy();
    expect(screen.getByText('Find plastic drop-off →')).toBeTruthy();
    expect(calls.some((c) => c.method === 'PATCH' && (c.body as { status?: string }).status === 'consumed')).toBe(true);
  });

  it('makes a recipe in a sheet, without the chat, and shows it in Recipes', async () => {
    const navigate = jest.fn();
    const { port, calls } = http();
    await renderWithProviders(<GroceryHistoryScreen />, {
      ports: { http: port, navigation: { navigate, replace() {}, back() {} } },
    });
    await waitFor(() => expect(screen.getByTestId('grocery-make-recipe')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('grocery-make-recipe'));
    await waitFor(() => expect(screen.getByTestId('make-recipe-idea-Kiwi smoothie')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('make-recipe-idea-Kiwi smoothie'));
    await waitFor(() => expect(screen.getByTestId('ai-recipe')).toBeTruthy());
    expect(screen.getByText('Kiwi smoothie')).toBeTruthy();
    expect(screen.getByTestId('grocery-tab-recipes').props.accessibilityState).toEqual({ selected: true });
    expect(navigate).not.toHaveBeenCalledWith('/ai');
    // Kept in DiVA's grocery chat, so it's there next time (and in DiVA).
    expect(calls.some((c) => c.path === '/chat' && c.method === 'POST')).toBe(true);
  });
});

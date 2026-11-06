import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AiScreen } from '@/features/ai';
import { useSessionStore } from '@/features/auth';
import { renderWithProviders } from '@/test/render';

const signIn = () => useSessionStore.setState({ session: { token: 't', userId: 'u1' }, hydrated: true });

type Call = {
  path: string;
  headers?: Record<string, string>;
  token?: string | null;
  body?: unknown;
};

function httpForAi(ask: (call: Call) => { status: number; body: unknown }) {
  const calls: Call[] = [];
  return {
    calls,
    http: {
      request: async (call: Call) => {
        calls.push(call);
        const { path } = call;
        if (path === '/profile') {
          return { status: 200, body: { firstName: 'Ada' } };
        }
        if (path.includes('/suggestions')) return { status: 200, body: { data: [] } };
        if (path.includes('/ask')) return ask(call);
        if (path === '/chat') return { status: 200, body: { data: [] } };
        return { status: 200, body: {} };
      },
    },
  };
}

const WHERE_REPLY = {
  status: 200,
  body: {
    type: 'AGENTIC',
    data: {
      answer: 'Open the Where tab.',
      tools: [{ name: 'navigateTo', parameters: { route: '/where' } }],
    },
    tokens: { kind: 'divaQuestion', cost: 20, left: 980 },
  },
};

describe('AiScreen', () => {
  it('opens straight into the chat, as web does, and navigates tools', async () => {
    const navigate = jest.fn();
    const { http } = httpForAi(() => WHERE_REPLY);
    await renderWithProviders(<AiScreen />, {
      ports: { http, navigation: { navigate, replace() {}, back() {} } },
    });
    signIn();
    await waitFor(() => expect(screen.getByTestId('ai-chip-dropoffs')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('ai-chip-dropoffs'));
    await waitFor(() => expect(screen.getByText('Open the Where tab.')).toBeTruthy());
    // Tools are grouped into actions: "/where" maps to the find_where group.
    await fireEvent.press(screen.getByTestId('ai-tool-find_where'));
    expect(navigate).toHaveBeenCalledWith('/where');
  });

  it("shows what the reply cost, and sends what DiVA needs to count it", async () => {
    const { http, calls } = httpForAi(() => WHERE_REPLY);
    await renderWithProviders(<AiScreen />, { ports: { http } });
    await waitFor(() => expect(screen.getByTestId('ai-chip-dropoffs')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('ai-chip-dropoffs'));
    await waitFor(() => expect(screen.getByText('−20 TK')).toBeTruthy());
    const ask = calls.find((c) => c.path.includes('/ask'));
    // The bearer is left to the client (the member's token), not blanked out.
    expect(ask?.token).toBeUndefined();
    expect((ask?.body as { allowance?: { surface?: string } }).allowance?.surface).toBe('app');
  });

  it("says when the tokens have run out, in the server's words", async () => {
    const { http } = httpForAi(() => ({
      status: 429,
      body: {
        code: 'allowance_used_up',
        kind: 'divaQuestion',
        message: 'A DiVA question takes 20 TK and you have 0 left.',
      },
    }));
    await renderWithProviders(<AiScreen />, { ports: { http } });
    await waitFor(() => expect(screen.getByTestId('ai-chip-dropoffs')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('ai-chip-dropoffs'));
    await waitFor(() =>
      expect(screen.getByText('A DiVA question takes 20 TK and you have 0 left.')).toBeTruthy(),
    );
  });

  it('gives a guest three free questions, then asks them to sign up', async () => {
    const { http, calls } = httpForAi(() => WHERE_REPLY);
    await renderWithProviders(<AiScreen />, { ports: { http } });
    await waitFor(() => expect(screen.getByText('3 free questions left as a guest')).toBeTruthy());
    const ask = async (text: string) => {
      await fireEvent.changeText(screen.getByTestId('ai-draft'), text);
      await fireEvent.press(screen.getByTestId('ai-send'));
    };
    for (let i = 0; i < 3; i += 1) {
      await ask(`question ${i + 1}`);
      await waitFor(() => expect(calls.filter((c) => c.path.includes('/ask'))).toHaveLength(i + 1));
    }
    await waitFor(() => expect(screen.getByTestId('ai-guest-signup')).toBeTruthy());
    await ask('question 4');
    expect(calls.filter((c) => c.path.includes('/ask'))).toHaveLength(3);
    // Nothing of a guest's is saved to a chat history.
    expect(calls.some((c) => c.path === '/chat' && (c as { method?: string }).method === 'POST')).toBe(false);
  });
});

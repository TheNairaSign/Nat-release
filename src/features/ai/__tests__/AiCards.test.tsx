import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AiScreen } from '@/features/ai';
import { renderWithProviders } from '@/test/render';

type Call = { path: string; method?: string; body?: unknown };

function http(answer: object) {
  const calls: Call[] = [];
  return {
    calls,
    port: {
      request: async (call: Call) => {
        calls.push(call);
        if (call.path.includes('/ask')) return { status: 200, body: answer };
        if (call.path === '/chat') return { status: 200, body: { data: [] } };
        return { status: 200, body: { data: [] } };
      },
    },
  };
}

async function ask(text: string) {
  await waitFor(() => expect(screen.getByTestId('ai-draft')).toBeTruthy());
  await fireEvent.changeText(screen.getByTestId('ai-draft'), text);
  await fireEvent.press(screen.getByTestId('ai-send'));
}

describe('DiVA reply cards', () => {
  it('shows the advice card with its steps and warning', async () => {
    const { port } = http({
      type: 'KNOWLEDGE',
      data: {
        answer: 'Here is how.',
        guidance: {
          item: 'battery',
          summary: 'Tape the ends.',
          steps: ['Tape the terminals'],
          elsewhere: ['Hardware stores'],
          caution: 'Never put batteries in the bin.',
          material: null,
        },
      },
    });
    await renderWithProviders(<AiScreen />, { ports: { http: port } });
    await ask('How do I get rid of batteries?');
    await waitFor(() => expect(screen.getByTestId('ai-guidance')).toBeTruthy());
    expect(screen.getByText('Tape the terminals')).toBeTruthy();
    expect(screen.getByText('Hardware stores')).toBeTruthy();
    expect(screen.getByText('Never put batteries in the bin.')).toBeTruthy();
  });

  it('rates a recipe', async () => {
    const { port, calls } = http({
      type: 'KNOWLEDGE',
      data: {
        answer: 'Try this.',
        recipe: { title: 'Banana bread', uses: ['bananas'], minutes: 60, steps: ['Mash'], tip: null },
      },
    });
    await renderWithProviders(<AiScreen />, { ports: { http: port } });
    await ask('Make a recipe with bananas');
    await waitFor(() => expect(screen.getByTestId('ai-recipe')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('recipe-star-4'));
    await waitFor(() => expect(screen.getByText('Thanks for rating it')).toBeTruthy());
    const rating = calls.find((c) => c.path === '/recipe-feedback');
    expect(rating?.body).toMatchObject({ title: 'Banana bread', rating: 4 });
  });

  it('asks to turn location on for a "near me" question when it is off', async () => {
    const { port } = http({ type: 'KNOWLEDGE', data: { answer: 'I can help with that.' } });
    await renderWithProviders(<AiScreen />, {
      ports: {
        http: port,
        location: {
          requestPermission: async () => false,
          getPermissionStatus: async () => 'prompt',
          getCurrentPosition: async () => null,
        },
      },
    });
    await ask('Where can I recycle glass near me?');
    await waitFor(() => expect(screen.getByTestId('ai-location-prompt')).toBeTruthy());
    expect(screen.getByText('Turn on location')).toBeTruthy();
  });
});

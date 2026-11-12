import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { TokensScreen } from '@/features/tokens';
import { renderWithProviders } from '@/test/render';

const ME = {
  enabled: true,
  tier: 'free',
  tierName: 'Freemium',
  resetsOn: '2026-12-01T00:00:00.000Z',
  tokens: { used: 1000, total: 1000, left: 380, extra: 380 },
  kinds: [
    { kind: 'groceryScan', label: 'Grocery scans', cost: 100, used: 1, tokens: 100, canAfford: 3 },
    { kind: 'divaQuestion', label: 'DiVA questions', cost: 20, used: 51, tokens: 1020, canAfford: 19 },
  ],
  billing: { paying: false, status: 'none', purchasable: false },
};

const OFFER = {
  tiers: [
    { key: 'free', name: 'Freemium', tokens: 1000, priceCents: 0, blurb: 'Free with your account', active: true },
    { key: 'tier1', name: 'Basic plan', tokens: 3000, priceCents: 599, blurb: 'Three times the tokens', active: true },
  ],
  topUps: [{ key: 'pack500', tokens: 500, priceCents: 199, active: true }],
};

const HISTORY = [
  { type: 'renewal', date: '2026-11-03T10:00:00.000Z', priceCents: 599, label: 'Basic plan', status: 'paid' },
  { type: 'topup', date: '2026-10-20T10:00:00.000Z', priceCents: 199, label: '500 AI tokens' },
];

function http(me: object, history: object[] = HISTORY) {
  return {
    request: async ({ path }: { path: string }) => ({
      status: 200,
      body: {
        data: path === '/allowance/me' ? me : path === '/allowance/history' ? history : OFFER,
      },
    }),
  };
}

describe('TokensScreen', () => {
  it('shows what is left, the bought tokens, where they went, and the tiers', async () => {
    await renderWithProviders(<TokensScreen />, { ports: { http: http(ME) } });
    await waitFor(() => expect(screen.getByTestId('tokens-left')).toBeTruthy());
    expect(screen.getByText('Left to use')).toBeTruthy();
    expect(screen.getByText(/Includes 380 TK you bought/)).toBeTruthy();
    expect(screen.getByText('Enough for 3 scans or 19 DiVA questions')).toBeTruthy();
    expect(screen.getByText('DiVA questions')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('tier-tier1')).toBeTruthy());
    expect(screen.getByText('Your tier')).toBeTruthy();
    expect(screen.getByText('Upgrades open soon')).toBeTruthy();
    expect(screen.getByText('Top-ups open soon')).toBeTruthy();
  });

  it('switches to History: each top-up and renewal with its price', async () => {
    await renderWithProviders(<TokensScreen />, { ports: { http: http(ME) } });
    await waitFor(() => expect(screen.getByTestId('tokens-tab-history')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('tokens-tab-history'));
    await waitFor(() => expect(screen.getByText('Basic plan renewal')).toBeTruthy());
    expect(screen.getByText('500 AI tokens')).toBeTruthy();
    expect(screen.getByText('$5.99')).toBeTruthy();
    // Plans' sections step aside.
    expect(screen.queryByText('DiVA questions')).toBeNull();
  });

  it('says so when nothing has been bought yet', async () => {
    await renderWithProviders(<TokensScreen />, { ports: { http: http(ME, []) } });
    await waitFor(() => expect(screen.getByTestId('tokens-tab-history')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('tokens-tab-history'));
    await waitFor(() => expect(screen.getByText(/No purchases yet/)).toBeTruthy());
  });

  it('offers no top-ups to a guest', async () => {
    await renderWithProviders(<TokensScreen />, {
      ports: { http: http({ ...ME, billing: undefined, tier: 'guest', tierName: 'Guest', resetsOn: null }) },
    });
    await waitFor(() => expect(screen.getByTestId('tokens-left')).toBeTruthy());
    expect(screen.queryByText('Top up')).toBeNull();
    expect(screen.queryByTestId('tokens-tab-history')).toBeNull();
  });
});

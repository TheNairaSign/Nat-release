import {
  allowanceUsedUpFrom,
  isAllowanceUsedUp,
  parseAllowance,
  parseTokenOffer,
  tk,
  usd,
} from '../allowance';

// GET /allowance/me as the server sends it (server main 595bf98).
const ME = {
  enabled: true,
  tier: 'free',
  tierName: 'Freemium',
  priceCents: 0,
  period: '2026-11',
  resetsOn: '2026-12-01T00:00:00.000Z',
  tokens: { used: 1000, total: 1000, left: 380, extra: 380 },
  kinds: [
    { kind: 'groceryScan', label: 'Grocery scans', cost: 100, used: 1, tokens: 100, canAfford: 3 },
    { kind: 'divaQuestion', label: 'DiVA questions', cost: 20, used: 51, tokens: 1020, canAfford: 19 },
    { kind: 'somethingNew', label: 'Ignored', cost: 1, used: 0, tokens: 0, canAfford: 0 },
  ],
  billing: { paying: false, status: 'none', cancelAtPeriodEnd: false, currentPeriodEnd: null, stripe: false, purchasable: false },
};

describe('AI tokens', () => {
  it('reads what the server sends, skipping kinds it does not know', () => {
    const a = parseAllowance(ME);
    expect(a?.tokens).toEqual({ used: 1000, total: 1000, left: 380, extra: 380 });
    expect(a?.kinds.map((k) => k.kind)).toEqual(['groceryScan', 'divaQuestion']);
    expect(a?.billing?.purchasable).toBe(false);
  });

  it("a guest's answer has no billing", () => {
    expect(parseAllowance({ ...ME, billing: undefined })?.billing).toBeNull();
  });

  it('turns the used-up 429 into its own error, and nothing else', () => {
    const error = allowanceUsedUpFrom(429, {
      code: 'allowance_used_up',
      kind: 'snapScan',
      message: 'A snap takes 100 TK and you have 40 left.',
      data: ME,
    });
    expect(isAllowanceUsedUp(error)).toBe(true);
    expect(error?.kind).toBe('snapScan');
    expect(error?.allowance?.tokens.left).toBe(380);
    expect(allowanceUsedUpFrom(429, { message: 'Too many requests' })).toBeNull();
    expect(allowanceUsedUpFrom(500, { code: 'allowance_used_up' })).toBeNull();
  });

  it('reads the offer, top-ups included', () => {
    const offer = parseTokenOffer({
      tiers: [{ key: 'tier1', name: 'Tier 1', tokens: 3000, priceCents: 599, active: true }],
      topUps: [{ key: 'pack500', tokens: 500, priceCents: 199, active: true }],
    });
    expect(offer.tiers[0]?.name).toBe('Tier 1');
    expect(offer.topUps[0]?.tokens).toBe(500);
  });

  it('formats like web', () => {
    expect(tk(3000)).toBe('3,000');
    expect(usd(599)).toBe('$5.99');
  });
});

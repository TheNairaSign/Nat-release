/**
 * AI tokens (TK): what someone has left and what each AI action costs. Mirrors web
 * `api/allowanceApi.ts` and `api/allowanceError.ts` on main (964a78a).
 */
export type AllowanceKind = 'groceryScan' | 'snapScan' | 'divaQuestion' | 'recipe';

export type AllowanceKindUse = {
  kind: AllowanceKind;
  label: string;
  /** Tokens one of these costs. */
  cost: number;
  /** How many were used this period, and the tokens they took. */
  used: number;
  tokens: number;
  /** How many more the tokens left would buy, if spent on this alone. */
  canAfford: number | null;
};

export type AllowanceBilling = {
  paying: boolean;
  status: 'none' | 'active' | 'past_due' | 'cancelled';
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  stripe: boolean;
  /** Whether buying can work on this server (false in production until Stripe is set). */
  purchasable: boolean;
};

export type Allowance = {
  enabled: boolean;
  tier: string;
  tierName: string;
  priceCents: number;
  period: string;
  /** When a member's tokens come back; null for a guest's, which don't. */
  resetsOn: string | null;
  /** `left` includes `extra` (bought tokens); `used` and `total` are the month's. */
  tokens: { used: number; total: number; left: number; extra: number };
  kinds: AllowanceKindUse[];
  /** Members only. */
  billing: AllowanceBilling | null;
};

export type TokenTier = {
  key: string;
  name: string;
  tokens: number;
  priceCents: number;
  blurb: string;
  active: boolean;
};

export type TopUpPack = {
  key: string;
  tokens: number;
  priceCents: number;
  active: boolean;
};

export type TokenOffer = { tiers: TokenTier[]; topUps: TopUpPack[] };

const KINDS: AllowanceKind[] = [
  'groceryScan',
  'snapScan',
  'divaQuestion',
  'recipe',
];
const STATUSES: AllowanceBilling['status'][] = [
  'none',
  'active',
  'past_due',
  'cancelled',
];

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;
const isKind = (v: unknown): v is AllowanceKind =>
  KINDS.includes(v as AllowanceKind);

function parseBilling(raw: unknown): AllowanceBilling | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = obj(raw);
  const status = STATUSES.includes(b.status as AllowanceBilling['status'])
    ? (b.status as AllowanceBilling['status'])
    : 'none';
  return {
    paying: b.paying === true,
    status,
    cancelAtPeriodEnd: b.cancelAtPeriodEnd === true,
    currentPeriodEnd:
      typeof b.currentPeriodEnd === 'string' ? b.currentPeriodEnd : null,
    stripe: b.stripe === true,
    // Web: `billing?.purchasable !== false`.
    purchasable: b.purchasable !== false,
  };
}

/** The `data` of GET /allowance/me (or a 429's `data`), read defensively. */
export function parseAllowance(raw: unknown): Allowance | null {
  const d = obj(raw);
  if (!d.tokens || !Array.isArray(d.kinds)) return null;
  const t = obj(d.tokens);
  return {
    enabled: d.enabled !== false,
    tier: str(d.tier, 'free'),
    tierName: str(d.tierName, 'Freemium'),
    priceCents: num(d.priceCents),
    period: str(d.period),
    resetsOn: typeof d.resetsOn === 'string' ? d.resetsOn : null,
    tokens: {
      used: num(t.used),
      total: num(t.total),
      left: num(t.left),
      extra: num(t.extra),
    },
    kinds: (d.kinds as unknown[]).flatMap((k) => {
      const row = obj(k);
      if (!isKind(row.kind)) return [];
      return [
        {
          kind: row.kind,
          label: str(row.label, row.kind),
          cost: num(row.cost),
          used: num(row.used),
          tokens: num(row.tokens),
          canAfford: typeof row.canAfford === 'number' ? row.canAfford : null,
        },
      ];
    }),
    billing: parseBilling(d.billing),
  };
}

/** The `data` of GET /allowance/tiers. */
export function parseTokenOffer(raw: unknown): TokenOffer {
  const d = obj(raw);
  const tiers = Array.isArray(d.tiers) ? d.tiers : [];
  const topUps = Array.isArray(d.topUps) ? d.topUps : [];
  return {
    tiers: tiers.flatMap((x) => {
      const r = obj(x);
      if (typeof r.key !== 'string') return [];
      return [
        {
          key: r.key,
          name: str(r.name, r.key),
          tokens: num(r.tokens),
          priceCents: num(r.priceCents),
          blurb: str(r.blurb),
          active: r.active !== false,
        },
      ];
    }),
    topUps: topUps.flatMap((x) => {
      const r = obj(x);
      if (typeof r.key !== 'string') return [];
      return [
        {
          key: r.key,
          tokens: num(r.tokens),
          priceCents: num(r.priceCents),
          active: r.active !== false,
        },
      ];
    }),
  };
}

/** Thrown in place of the 429 a route answers when the tokens have run out. */
export class AllowanceUsedUpError extends Error {
  readonly kind: AllowanceKind;
  readonly allowance: Allowance | null;

  constructor(
    message: string,
    kind: AllowanceKind,
    allowance: Allowance | null,
  ) {
    super(message);
    this.name = 'AllowanceUsedUpError';
    this.kind = kind;
    this.allowance = allowance;
  }
}

export function isAllowanceUsedUp(
  error: unknown,
): error is AllowanceUsedUpError {
  return error instanceof AllowanceUsedUpError;
}

/** The error a response stands for when it is "tokens used up", else null. */
export function allowanceUsedUpFrom(
  status: number,
  body: unknown,
): AllowanceUsedUpError | null {
  const b = obj(body);
  if (status !== 429 || b.code !== 'allowance_used_up') return null;
  return new AllowanceUsedUpError(
    str(b.message, "You've used your AI tokens."),
    isKind(b.kind) ? b.kind : 'divaQuestion',
    parseAllowance(b.data),
  );
}

/** "1,000" */
export const tk = (n: number): string => n.toLocaleString('en-US');

/** "$5.99" */
export const usd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

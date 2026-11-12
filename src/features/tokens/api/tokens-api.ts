import {
  parseAllowance,
  parsePurchaseHistory,
  parseTokenOffer,
  type Allowance,
  type PurchaseHistoryEntry,
  type TokenOffer,
} from '@/core/allowance';
import { assertOk } from '@/shared/api';
import { unwrapDataObject } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

export const allowanceQueryKey = ['allowance', 'me'] as const;
export const tokenOfferQueryKey = ['allowance', 'tiers'] as const;

/** GET /allowance/me: members by their login, guests by the device id header. */
export async function fetchAllowance(http: HttpClient): Promise<Allowance> {
  const response = await http.request({ path: '/allowance/me' });
  assertOk(response.status, response.body);
  const allowance = parseAllowance(unwrapDataObject(response.body));
  if (!allowance) throw new Error("Couldn't read your tokens.");
  return allowance;
}

/** GET /allowance/tiers: the tiers and top-up packs on offer. */
export async function fetchTokenOffer(http: HttpClient): Promise<TokenOffer> {
  const response = await http.request({ path: '/allowance/tiers' });
  assertOk(response.status, response.body);
  return parseTokenOffer(unwrapDataObject(response.body));
}

export const purchaseHistoryQueryKey = ['allowance', 'history'] as const;

/** GET /allowance/history: every top-up and tier renewal they've paid for. */
export async function fetchPurchaseHistory(http: HttpClient): Promise<PurchaseHistoryEntry[]> {
  const response = await http.request({ path: '/allowance/history' });
  assertOk(response.status, response.body);
  const body = response.body as { data?: unknown } | unknown;
  const data = body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : body;
  return parsePurchaseHistory(data);
}

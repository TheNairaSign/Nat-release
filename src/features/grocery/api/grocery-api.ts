import {
  parseGroceryItem,
  parseGroceryScan,
  parseWasteStats,
  type GroceryItem,
  type GroceryItemStatus,
  type GroceryScan,
  type GroceryWasteStats,
} from '@/core/grocery';
import { assertOk } from '@/shared/api';
import { unwrapDataObject, unwrapList } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

/**
 * The Grocery Manager's list calls on our server (web api/groceryApi.ts, main 964a78a).
 * The scanner's own calls (scan session, ML carts) live with the scanner.
 */
export const groceryKeys = {
  all: ['grocery'] as const,
  items: (status: string) => ['grocery', 'items', status] as const,
  scans: ['grocery', 'scans'] as const,
  stats: (period: string) => ['grocery', 'stats', period] as const,
};

const items = (body: unknown): GroceryItem[] =>
  unwrapList(body).flatMap((row) => {
    const item = parseGroceryItem(row);
    return item ? [item] : [];
  });

function itemOrThrow(body: unknown): GroceryItem {
  const item = parseGroceryItem(unwrapDataObject(body));
  if (!item) throw new Error("Couldn't read that item.");
  return item;
}

export async function listItems(
  http: HttpClient,
  status: 'active' | 'consumed' | 'discarded' = 'active',
): Promise<GroceryItem[]> {
  const response = await http.request({ path: `/grocery/items?status=${status}` });
  assertOk(response.status, response.body);
  return items(response.body);
}

/** Every past scan, each with its photo and what was found in it. */
export async function listScans(http: HttpClient): Promise<GroceryScan[]> {
  const response = await http.request({ path: '/grocery/scans' });
  assertOk(response.status, response.body);
  return unwrapList(response.body).flatMap((row) => {
    const scan = parseGroceryScan(row);
    return scan ? [scan] : [];
  });
}

/** Used against wasted over a period, for History's summary card. */
export async function wasteStats(
  http: HttpClient,
  period: 'week' | 'month' = 'month',
): Promise<GroceryWasteStats | null> {
  const response = await http.request({ path: `/grocery/stats?period=${period}` });
  assertOk(response.status, response.body);
  return parseWasteStats(unwrapDataObject(response.body));
}

export async function updateItem(
  http: HttpClient,
  id: string,
  changes: Partial<{
    name: string;
    status: GroceryItemStatus;
    expiresOn: string;
    remindersEnabled: boolean;
  }>,
): Promise<GroceryItem> {
  const response = await http.request({
    path: `/grocery/items/${encodeURIComponent(id)}`,
    method: 'PATCH',
    body: changes,
  });
  assertOk(response.status, response.body);
  return itemOrThrow(response.body);
}

/**
 * Used or threw away `count` of a row: all of it, or some of a combined row ("2 of the
 * 3 limes"), which splits them off into a row of their own (`settled`).
 */
export async function settleItems(
  http: HttpClient,
  id: string,
  status: 'consumed' | 'discarded',
  count: number,
): Promise<{ remaining: GroceryItem | null; settled: GroceryItem }> {
  const response = await http.request({
    path: `/grocery/items/${encodeURIComponent(id)}/settle`,
    method: 'POST',
    body: { status, count },
  });
  assertOk(response.status, response.body);
  const data = unwrapDataObject(response.body) ?? {};
  return {
    remaining: parseGroceryItem(data.remaining),
    settled: itemOrThrow({ data: data.settled }),
  };
}

/** Undo a partial settle: the split-off items go back into their row. */
export async function rejoinItems(http: HttpClient, settledId: string): Promise<GroceryItem> {
  const response = await http.request({
    path: `/grocery/items/${encodeURIComponent(settledId)}/rejoin`,
    method: 'POST',
  });
  assertOk(response.status, response.body);
  return itemOrThrow(response.body);
}

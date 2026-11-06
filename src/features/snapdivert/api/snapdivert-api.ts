import {
  parseIdentified,
  parseSnapItem,
  type IdentifiedItem,
  type SnapCondition,
  type SnapItem,
  type SnapStats,
  type SnapStatus,
} from '@/core/snapdivert';
import type { ScanSession } from '@/features/grocery';
import { assertOk } from '@/shared/api';
import { unwrapDataObject, unwrapList } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

/** SnapDivert's calls (web api/snapDivertApi.ts, main 964a78a). */
export const snapKeys = {
  items: ['snapdivert', 'items'] as const,
  stats: ['snapdivert', 'stats'] as const,
};

/** Upload signature and ML token, as a grocery scan session. Throws used-up. */
export async function createSnapSession(http: HttpClient, guest: boolean): Promise<ScanSession> {
  const response = await http.request({
    path: guest ? '/snapdivert/guest-session' : '/snapdivert/session',
    method: 'POST',
  });
  assertOk(response.status, response.body);
  const d = unwrapDataObject(response.body) ?? {};
  const upload = (d.upload ?? {}) as Record<string, unknown>;
  const ml = (d.ml ?? {}) as Record<string, unknown>;
  if (typeof upload.url !== 'string' || typeof ml.baseUrl !== 'string' || typeof ml.token !== 'string') {
    throw new Error("Couldn't start the snap.");
  }
  return {
    upload: { url: upload.url, fields: (upload.fields ?? {}) as Record<string, string | number> },
    ml: { baseUrl: ml.baseUrl, token: ml.token, expiresAt: String(ml.expiresAt ?? '') },
  };
}

/** Ask the ML service what's on the photo. Takes a few seconds. */
export async function identify(
  http: HttpClient,
  session: ScanSession,
  imageUrl: string,
): Promise<IdentifiedItem[]> {
  const response = await http.request({
    path: `${session.ml.baseUrl.replace(/\/$/, '')}/v1/snaps/identify`,
    method: 'POST',
    token: session.ml.token,
    body: { image_url: imageUrl },
  });
  if (response.status >= 300) {
    const message = (response.body as { error?: { message?: string } } | null)?.error?.message;
    throw new Error(message || "We couldn't look at that photo. Try again.");
  }
  return parseIdentified(response.body);
}

const items = (body: unknown): SnapItem[] =>
  unwrapList(body).flatMap((row) => {
    const item = parseSnapItem(row);
    return item ? [item] : [];
  });

export async function saveSnap(http: HttpClient, imageUrl: string, found: IdentifiedItem[]): Promise<SnapItem[]> {
  const response = await http.request({ path: '/snapdivert/snaps', method: 'POST', body: { imageUrl, items: found } });
  assertOk(response.status, response.body);
  const data = unwrapDataObject(response.body) ?? {};
  return items({ data: data.items });
}

export async function listSnapItems(http: HttpClient): Promise<SnapItem[]> {
  const response = await http.request({ path: '/snapdivert/items' });
  assertOk(response.status, response.body);
  return items(response.body);
}

export async function snapStats(http: HttpClient): Promise<SnapStats | null> {
  const response = await http.request({ path: '/snapdivert/stats' });
  assertOk(response.status, response.body);
  const d = unwrapDataObject(response.body);
  if (!d) return null;
  return {
    days: Number(d.days) || 30,
    diverted: Number(d.diverted) || 0,
    disposed: Number(d.disposed) || 0,
    savedShare: typeof d.savedShare === 'number' ? d.savedShare : null,
  };
}

export async function updateSnapItem(
  http: HttpClient,
  id: string,
  changes: Partial<{ name: string; condition: SnapCondition | null; status: SnapStatus }>,
): Promise<void> {
  const response = await http.request({
    path: `/snapdivert/items/${encodeURIComponent(id)}`,
    method: 'PATCH',
    body: changes,
  });
  assertOk(response.status, response.body);
}

/** Something on the photo that isn't being got rid of: it goes, uncounted. */
export async function removeSnapItem(http: HttpClient, id: string): Promise<void> {
  const response = await http.request({ path: `/snapdivert/items/${encodeURIComponent(id)}`, method: 'DELETE' });
  assertOk(response.status, response.body);
}

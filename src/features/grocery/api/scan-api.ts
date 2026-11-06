import { parseMlCart, type MlCart } from '@/core/grocery';
import { assertOk } from '@/shared/api';
import { unwrapDataObject } from '@/shared/api/unwrap';
import type { HttpClient } from '@/shared/ports/http';

/**
 * The scanner's calls (web api/groceryApi.ts, main 964a78a): a scan session from our
 * server (it spends the AI tokens), the photo straight to Cloudinary with the session's
 * signed fields, then the ML service's cart.
 */
export type ScanSession = {
  upload: { url: string; fields: Record<string, string | number> };
  ml: { baseUrl: string; token: string; expiresAt: string };
};

function parseSession(body: unknown): ScanSession {
  const d = unwrapDataObject(body) ?? {};
  const upload = (d.upload ?? {}) as Record<string, unknown>;
  const ml = (d.ml ?? {}) as Record<string, unknown>;
  if (typeof upload.url !== 'string' || typeof ml.baseUrl !== 'string' || typeof ml.token !== 'string') {
    throw new Error("Couldn't start the scan.");
  }
  return {
    upload: { url: upload.url, fields: (upload.fields ?? {}) as Record<string, string | number> },
    ml: { baseUrl: ml.baseUrl, token: ml.token, expiresAt: String(ml.expiresAt ?? '') },
  };
}

/** Members' scans are kept; a guest's scan works but nothing is saved. Throws used-up. */
export async function createScanSession(http: HttpClient, guest: boolean): Promise<ScanSession> {
  const response = await http.request({
    path: guest ? '/grocery/guest-scan-session' : '/grocery/scan-session',
    method: 'POST',
  });
  assertOk(response.status, response.body);
  return parseSession(response.body);
}

/** Direct-to-Cloudinary upload using the session's signed fields; resolves the photo URL. */
export async function uploadCartPhoto(
  http: HttpClient,
  upload: ScanSession['upload'],
  photo: { base64: string; mimeType: string },
): Promise<string> {
  const form = new FormData();
  for (const [key, value] of Object.entries(upload.fields)) form.append(key, String(value));
  // Cloudinary takes the photo as a data URL, which travels through any fetch.
  form.append('file', `data:${photo.mimeType};base64,${photo.base64}`);
  const response = await http.request({ path: upload.url, method: 'POST', body: form, form: true, token: '' });
  const body = (response.body ?? {}) as { secure_url?: unknown; error?: { message?: string } };
  if (response.status >= 300 || typeof body.secure_url !== 'string') {
    throw new Error(body.error?.message || 'Photo upload failed');
  }
  return body.secure_url;
}

/** An ML service call: its own base URL and its own short-lived token. */
async function ml(
  http: HttpClient,
  session: ScanSession,
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<MlCart> {
  const response = await http.request({
    path: `${session.ml.baseUrl.replace(/\/$/, '')}${path}`,
    method,
    body,
    token: session.ml.token,
  });
  if (response.status >= 300) {
    const b = (response.body ?? {}) as { error?: { message?: string }; detail?: unknown; message?: string };
    const detail = b.error?.message || b.message || (Array.isArray(b.detail) ? '' : b.detail);
    throw new Error(typeof detail === 'string' && detail ? detail : 'ML request failed');
  }
  const cart = parseMlCart(response.body);
  if (!cart) throw new Error("Couldn't read the scan.");
  return cart;
}

export const scanApi = {
  start: (http: HttpClient, s: ScanSession, imageUrl: string) =>
    ml(http, s, '/v1/scans', 'POST', { image_url: imageUrl }),
  getCart: (http: HttpClient, s: ScanSession, id: string) => ml(http, s, `/v1/carts/${id}`),
  updateItem: (
    http: HttpClient,
    s: ScanSession,
    id: string,
    tag: number,
    changes: { label?: string; expires_on?: string },
  ) => ml(http, s, `/v1/carts/${id}/items/${tag}`, 'PATCH', changes),
  removeItem: (http: HttpClient, s: ScanSession, id: string, tag: number) =>
    ml(http, s, `/v1/carts/${id}/items/${tag}`, 'DELETE'),
  /** Combine every item sharing this one's name, so one date covers the lot. */
  merge: (http: HttpClient, s: ScanSession, id: string, tag: number) =>
    ml(http, s, `/v1/carts/${id}/items/${tag}/merge`, 'POST'),
  /** Take an item back out of its group. */
  split: (http: HttpClient, s: ScanSession, id: string, tag: number) =>
    ml(http, s, `/v1/carts/${id}/items/${tag}/split`, 'POST'),
  keepSeparate: (http: HttpClient, s: ScanSession, id: string, tag: number) =>
    ml(http, s, `/v1/carts/${id}/items/${tag}/keep-separate`, 'POST'),
  confirm: (http: HttpClient, s: ScanSession, id: string) => ml(http, s, `/v1/carts/${id}/confirm`, 'POST'),
  finalize: (http: HttpClient, s: ScanSession, id: string) => ml(http, s, `/v1/carts/${id}/finalize`, 'POST'),
};

/**
 * Poll until the cart leaves `processing` (analysis usually takes 20-40s): from 1.5s,
 * backing off to 5s. Throws on `failed`, after two minutes, or when cancelled.
 */
export async function pollUntilSettled(
  http: HttpClient,
  session: ScanSession,
  cartId: string,
  { cancelled, wait = (ms: number) => new Promise((r) => setTimeout(r, ms)) }: {
    cancelled: () => boolean;
    wait?: (ms: number) => Promise<unknown>;
  },
): Promise<MlCart> {
  const started = Date.now();
  let delayMs = 1500;
  for (;;) {
    if (cancelled()) throw new Error('Scan cancelled');
    const cart = await scanApi.getCart(http, session, cartId);
    if (cart.status !== 'processing') {
      if (cart.status === 'failed') throw new Error(cart.failure_reason || 'Scan failed');
      return cart;
    }
    if (Date.now() - started > 120_000) {
      throw new Error('This is taking longer than usual. Please try again in a minute.');
    }
    await wait(delayMs);
    delayMs = Math.min(5000, Math.round(delayMs * 1.4));
  }
}

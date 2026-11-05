import { allowanceUsedUpFrom } from '@/core/allowance';

export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? defaultHttpErrorMessage(status, body));
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

function defaultHttpErrorMessage(status: number, body: unknown): string {
  return readErrorBody(body) ?? `HTTP ${status}`;
}

export function readErrorBody(body: unknown): string | null {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message.trim();
    }
  }
  return null;
}

export function readHttpErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): string {
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

/**
 * Throws for a failed response. "AI tokens used up" (429 `allowance_used_up`) comes
 * back as its own error, carrying the server's words, as web's api.ts does.
 */
export function assertOk(status: number, body: unknown): void {
  if (status < 200 || status >= 300) {
    throw allowanceUsedUpFrom(status, body) ?? new HttpError(status, body);
  }
}
